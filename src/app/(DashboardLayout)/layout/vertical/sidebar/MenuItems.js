import { uniqueId } from 'lodash';

import {
  IconPoint,
  IconSchool,
  IconChartBar,
} from '@tabler/icons-react';

const Menuitems = [
  {
    navlabel: true,
    subheader: 'Apps',
  },
  {
    id: uniqueId(),
    title: 'Teacher Dashboard',
    icon: IconChartBar,
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

export default Menuitems;
