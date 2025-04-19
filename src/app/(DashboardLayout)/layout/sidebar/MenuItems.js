import {
  IconBook,
  IconLayoutDashboard,
  IconUserCircle,
  IconSchool,
  IconNotebook,
  IconBookmark,
  IconStar,
  IconChartBar,
} from '@tabler/icons-react';

const MenuItems = (userRole) => {
  // Items for all users (dashboard, profile)
  const baseItems = [
    {
      id: 1,
      title: 'Dashboard',
      icon: IconLayoutDashboard,
      href: '/dashboard',
    },
    {
      id: 2,
      title: 'Profile',
      icon: IconUserCircle,
      href: '/profile',
    },
  ];

  // Items specific to tutors
  const tutorItems = [
    {
      id: 3,
      title: 'Teacher Dashboard',
      icon: IconChartBar,
      href: '/teacher/dashboard',
    },
    {
      id: 4,
      title: 'My Courses',
      icon: IconBook,
      href: '/courses',
    },
    {
      id: 5,
      title: 'Create Course',
      icon: IconNotebook,
      href: '/courses/create',
    },
  ];

  // Items specific to students
  const studentItems = [
    {
      id: 3,
      title: 'Browse Courses',
      icon: IconSchool,
      href: '/student/courses',
    },
    {
      id: 4,
      title: 'My Enrolled Courses',
      icon: IconBook,
      href: '/student/enrolled',
    },
    {
      id: 5,
      title: 'Wishlist',
      icon: IconBookmark,
      href: '/student/wishlist',
    },
  ];

  // Return different menu items based on role
  if (userRole === 'student') {
    return [...baseItems, ...studentItems];
  } else {
    // Default to tutor/instructor view
    return [...baseItems, ...tutorItems];
  }
};

export default MenuItems; 