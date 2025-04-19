import { uniqueId } from 'lodash';
import {
  IconSchool,
  IconBook,
  IconUserCircle,
  IconLayoutDashboard,
  IconBookmark,
  IconNotebook,
  IconPoint,
} from '@tabler/icons-react';

// Dynamic menu items based on user role
const getMenuItems = (role) => {
  const baseItems = [
    {
      navlabel: true,
      subheader: 'Home',
    },
    {
      id: uniqueId(),
      title: 'Dashboard',
      icon: IconLayoutDashboard,
      href: '/dashboard',
    },
    {
      id: uniqueId(),
      title: 'Profile',
      icon: IconUserCircle,
      href: '/profile',
    },
  ];

  // Student-specific menu items
  if (role === 'student') {
    return [
      ...baseItems,
      {
        navlabel: true,
        subheader: 'Courses',
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
      },
      {
        id: uniqueId(),
        title: 'Wishlist',
        icon: IconBookmark,
        href: '/student/wishlist',
      },
    ];
  }
  
  // Tutor-specific menu items - keep the original structure
  return [
    ...baseItems,
    {
      navlabel: true,
      subheader: 'Apps',
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
