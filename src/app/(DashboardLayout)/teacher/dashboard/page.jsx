'use client';
import { useState, useEffect } from 'react';
import { Box, Grid, Typography, Chip, Card, CardContent, LinearProgress, CircularProgress, Alert, Stack, Divider } from '@mui/material';
import { Client, Databases, Query, Account } from 'appwrite';
import { collections } from '@/appwrite/collections';
import { projectID, databaseId } from '@/appwrite/config';
import { useAuth } from '@/app/context/AuthContext';
import PageContainer from '@/app/components/container/PageContainer';
import DashboardCard from '@/app/components/shared/DashboardCard';
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useTheme } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PlayLessonIcon from '@mui/icons-material/PlayLesson';
import StarIcon from '@mui/icons-material/Star';

const TeacherDashboard = () => {
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalLessons: 0,
    averageProgress: 0,
    recentEnrollments: [],
    courseEnrollmentData: [],
    progressData: []
  });
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    const fetchTeacherAnalytics = async () => {
      try {
        if (!user || !user.$id) {
          setError("You need to be logged in as a teacher to view this dashboard");
          setLoading(false);
          return;
        }

        const client = new Client();
        client
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
          .setProject(projectID);

        const databases = new Databases(client);
        const account = new Account(client);

        // 1. Get all courses created by this teacher
        const coursesResponse = await databases.listDocuments(
          databaseId,
          collections.courses,
          [Query.equal('tutorId', user.$id)]
        );

        const courses = coursesResponse.documents;
        const courseIds = courses.map(course => course.$id);

        if (courseIds.length === 0) {
          setAnalytics({
            totalStudents: 0,
            totalCourses: 0,
            totalLessons: 0,
            averageProgress: 0,
            recentEnrollments: [],
            courseEnrollmentData: [],
            progressData: []
          });
          setLoading(false);
          return;
        }

        // 2. Get enrollments for all courses
        const enrollmentsPromises = courseIds.map(courseId => 
          databases.listDocuments(
            databaseId,
            collections.enrollments,
            [Query.equal('courseId', courseId)]
          )
        );

        const enrollmentsResponses = await Promise.all(enrollmentsPromises);
        
        // Flatten all enrollments
        const allEnrollments = enrollmentsResponses.flatMap(response => response.documents);
        
        // Get unique student IDs
        const studentIds = [...new Set(allEnrollments.map(enrollment => enrollment.userId))];

        // 3. Get all course content (lessons)
        const lessonsPromises = courseIds.map(courseId => 
          databases.listDocuments(
            databaseId,
            collections.courseContents,
            [Query.equal('courseId', courseId)]
          )
        );

        const lessonsResponses = await Promise.all(lessonsPromises);
        const allLessons = lessonsResponses.flatMap(response => response.documents);

        // 4. Calculate average progress across all enrollments
        let totalProgress = 0;
        allEnrollments.forEach(enrollment => {
          totalProgress += enrollment.progress || 0;
        });
        const averageProgress = allEnrollments.length > 0 
          ? Math.round(totalProgress / allEnrollments.length) 
          : 0;

        // 5. Get course enrollment data for chart
        const courseEnrollmentData = courses.map(course => {
          const enrollments = allEnrollments.filter(e => e.courseId === course.$id);
          return {
            courseName: course.title,
            count: enrollments.length
          };
        });

        // 6. Get progress data for chart
        const progressRanges = [
          { range: '0-25%', count: 0 },
          { range: '26-50%', count: 0 },
          { range: '51-75%', count: 0 },
          { range: '76-100%', count: 0 }
        ];

        allEnrollments.forEach(enrollment => {
          const progress = enrollment.progress || 0;
          if (progress <= 25) progressRanges[0].count++;
          else if (progress <= 50) progressRanges[1].count++;
          else if (progress <= 75) progressRanges[2].count++;
          else progressRanges[3].count++;
        });

        // 7. Get recent enrollments and fetch student names
        const recentEnrollments = [...allEnrollments]
          .sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
          .slice(0, 5);

        // Get user names from auth or database
        const studentDetailsPromises = recentEnrollments.map(async (enrollment) => {
          try {
            let studentName = 'Student';
            
            // Method 1: Try to get user from auth directly
            try {
              // This will work only if the current user has permission to get other users
              const accountInfo = await account.get(enrollment.userId);
              studentName = accountInfo.name || `${accountInfo.firstName || ''} ${accountInfo.lastName || ''}`.trim();
            } catch (error) {
              console.log('Could not fetch from auth directly, trying database');
            }
            
            // Method 2: If Method 1 fails, try from users collection in database
            if (studentName === 'Student') {
              const userDoc = await databases.listDocuments(
                databaseId,
                collections.users, // Make sure this collection exists
                [Query.equal('$id', enrollment.userId)]
              );
              
              if (userDoc.documents.length > 0) {
                const studentData = userDoc.documents[0];
                studentName = studentData.name || 
                            `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || 
                            studentData.email || 'Student';
              }
            }
            
            // Method 3: If the userId is the user's email (sometimes the case with Appwrite)
            if (studentName === 'Student' && enrollment.userId.includes('@')) {
              studentName = enrollment.userId.split('@')[0]; // Use part before @ as name
            }
            
            return {
              ...enrollment,
              studentName: studentName || 'Student'
            };
          } catch (error) {
            console.error('Error fetching student details:', error);
            return {
              ...enrollment,
              studentName: 'Student'
            };
          }
        });

        const enrollmentsWithStudentDetails = await Promise.all(studentDetailsPromises);

        // Set all analytics data
        setAnalytics({
          totalStudents: studentIds.length,
          totalCourses: courses.length,
          totalLessons: allLessons.length,
          averageProgress,
          recentEnrollments: enrollmentsWithStudentDetails,
          courseEnrollmentData,
          progressData: progressRanges
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching teacher analytics:', error);
        setError("Failed to load analytics. Please try again later.");
        setLoading(false);
      }
    };

    fetchTeacherAnalytics();
  }, [user]);

  // Chart for course enrollments
  const courseEnrollmentChartOptions = {
    chart: {
      type: 'bar',
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: '#adb0bb',
      toolbar: {
        show: false,
      },
      height: 250,
    },
    colors: [theme.palette.primary.main],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: analytics.courseEnrollmentData.map(item => item.courseName),
    },
    yaxis: {
      title: {
        text: 'Enrollments',
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
      y: {
        formatter: function (val) {
          return `${val} students`;
        },
      },
    },
  };

  const courseEnrollmentChartSeries = [
    {
      name: 'Enrollments',
      data: analytics.courseEnrollmentData.map(item => item.count),
    },
  ];

  // Chart for progress distribution
  const progressDistributionOptions = {
    chart: {
      type: 'donut',
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
    },
    colors: [
      theme.palette.error.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.success.main,
    ],
    labels: ['0-25%', '26-50%', '51-75%', '76-100%'],
    tooltip: {
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
      y: {
        formatter: function(val, { seriesIndex, dataPointIndex, w }) {
          const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
          const percentage = ((val / total) * 100).toFixed(1);
          return `${val} students (${percentage}%)`;
        }
      }
    },
    legend: {
      show: false // Hide the default legend as we'll use custom chips
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: false
            },
            value: {
              show: false
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total',
              fontSize: '18px',
              fontWeight: 'bold',
              color: theme.palette.text.primary,
              formatter: function (w) {
                return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
              }
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 280,
          }
        },
      },
    ],
  };

  const progressDistributionSeries = analytics.progressData.map(item => item.count);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <PageContainer title="Teacher Dashboard" description="Teaching analytics and insights">
      <Box mt={3}>
        <Typography variant="h4" mb={3}>
          Teacher Dashboard
        </Typography>
        
        {/* Top Stats Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'primary.light', height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <PersonIcon color="primary" sx={{ width: 40, height: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h3" fontWeight="700" color="primary.main">
                      {analytics.totalStudents}
                    </Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                      Total Students
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'success.light', height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <MenuBookIcon color="success" sx={{ width: 40, height: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h3" fontWeight="700" color="success.main">
                      {analytics.totalCourses}
                    </Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                      Total Courses
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'warning.light', height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <PlayLessonIcon color="warning" sx={{ width: 40, height: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h3" fontWeight="700" color="warning.main">
                      {analytics.totalLessons}
                    </Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                      Total Lessons
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'info.light', height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <StarIcon color="info" sx={{ width: 40, height: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h3" fontWeight="700" color="info.main">
                      {analytics.averageProgress}%
                    </Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                      Average Progress
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Charts Row */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={7}>
            <DashboardCard 
              title="Course Enrollments" 
              subtitle="Students enrolled per course"
              sx={{ height: '420px' }}
            >
              {analytics.courseEnrollmentData.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="280px">
                  <Typography variant="subtitle1" color="textSecondary">
                    No enrollment data available
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Chart
                    options={courseEnrollmentChartOptions}
                    series={courseEnrollmentChartSeries}
                    type="bar"
                    height={280}
                    width="100%"
                  />
                </Box>
              )}
            </DashboardCard>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <DashboardCard 
              title="Progress Distribution" 
              subtitle="Student progress across all courses"
              sx={{ height: '420px' }}
            >
              {analytics.progressData.every(item => item.count === 0) ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="280px">
                  <Typography variant="subtitle1" color="textSecondary">
                    No progress data available
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '320px' }}>
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <Chart
                      options={progressDistributionOptions}
                      series={progressDistributionSeries}
                      type="donut"
                      height={240}
                      width="100%"
                    />
                  </Box>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                      gap: 1,
                      mt: 'auto'
                    }}
                  >
                    {analytics.progressData.map((item, index) => {
                      const colors = [
                        theme.palette.error.main, 
                        theme.palette.warning.main,
                        theme.palette.info.main,
                        theme.palette.success.main
                      ];
                      const labels = ['0-25%', '26-50%', '51-75%', '76-100%'];
                      const total = progressDistributionSeries.reduce((a, b) => a + b, 0);
                      const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0';
                      
                      return (
                        <Chip 
                          key={index}
                          size="small" 
                          label={`${labels[index]}: ${item.count} (${percentage}%)`}
                          sx={{ 
                            bgcolor: colors[index], 
                            color: 'white',
                            fontWeight: 'medium',
                            px: 1
                          }} 
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}
            </DashboardCard>
          </Grid>
        </Grid>
        
        {/* Recent Enrollments */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <DashboardCard title="Recent Enrollments" subtitle="Latest students enrolled in your courses">
              {analytics.recentEnrollments.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                  <Typography variant="subtitle1" color="textSecondary">
                    No recent enrollments
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2} divider={<Divider flexItem />}>
                  {analytics.recentEnrollments.map((enrollment, index) => (
                    <Box key={enrollment.$id} display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1">
                          {enrollment.studentName || 'Student'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Chip 
                          label={`${enrollment.progress || 0}% completed`}
                          color={
                            (enrollment.progress || 0) >= 75 ? "success" : 
                            (enrollment.progress || 0) >= 50 ? "info" : 
                            (enrollment.progress || 0) >= 25 ? "warning" : "error"
                          }
                          size="small"
                        />
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </DashboardCard>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default TeacherDashboard; 