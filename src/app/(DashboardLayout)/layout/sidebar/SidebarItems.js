import React from 'react';
import { Box, List } from '@mui/material';
import { usePathname } from 'next/navigation';
import NavItem from './NavItem';
import NavGroup from './NavGroup/NavGroup';
import MenuItems from './MenuItems';

const SidebarItems = ({ userRole }) => {
  const pathname = usePathname();
  const pathDirect = pathname;

  // Get menu items based on user role
  const menuItems = MenuItems(userRole);

  return (
    <Box sx={{ px: 3 }}>
      <List sx={{ pt: 0 }} className="sidebarNav">
        <NavGroup title="Menu">
          {menuItems.map((item) => {
            return (
              <NavItem
                item={item}
                key={item.id}
                pathDirect={pathDirect}
              />
            );
          })}
        </NavGroup>
      </List>
    </Box>
  );
};

export default SidebarItems; 