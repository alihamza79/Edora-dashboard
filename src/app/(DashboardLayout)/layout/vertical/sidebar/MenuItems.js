import { uniqueId } from 'lodash';
import {
  IconSchool,
  IconBook,
  IconUserCircle,
  IconLayoutDashboard,
  IconNotebook,
  IconPoint,
} from '@tabler/icons-react';

// Dynamic menu items based on user role
const getMenuItems = (role) => {
  // Student-specific menu items
  if (role === 'student') {
    return [
      {
        id: uniqueId(),
        title: 'Dashboard',
        icon: IconLayoutDashboard,
        href: '/student/dashboard',
      },
      {
        id: uniqueId(),
        title: 'Browse Courses',
        icon: IconSchool,
        href: '/student/courses',
      },
      {
        id: uniqueId(),
        title: 'My Enrolled Courses',
        icon: IconBook,
        href: '/student/enrolled',
      }
    ];
  }
  
  // Tutor-specific menu items - keep the original structure
  return [
    {
      id: uniqueId(),
      title: 'Dashboard',
      icon: IconLayoutDashboard,
      href: '/teacher/dashboard',
    },
    {
      id: uniqueId(),
      title: 'Courses',
      icon: IconSchool,
      chip: 'New',
      chipColor: 'success',
      href: '/courses',
      children: [
        {
          id: uniqueId(),
          title: 'All Courses',
          icon: IconPoint,
          href: '/courses',
        },
        {
          id: uniqueId(),
          title: 'Create Course',
          icon: IconPoint,
          href: '/courses/create',
        },
      ],
    }
  ];
};

// Default menu items - will be replaced with dynamic items
const Menuitems = getMenuItems('tutor');

export { getMenuItems };
export default Menuitems;
