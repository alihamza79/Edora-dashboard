'use client';
import Menuitems, { getMenuItems } from './MenuItems';
import { usePathname } from "next/navigation";
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDispatch, useSelector } from 'react-redux';
import NavItem from './NavItem';
import NavCollapse from './NavCollapse';
import NavGroup from './NavGroup/NavGroup';
import { toggleMobileSidebar } from '@/store/customizer/CustomizerSlice';
import { useAuth } from '@/app/context/AuthContext';


const SidebarItems = () => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState(Menuitems); // Initialize with default items
  const pathname = usePathname();
  const pathDirect = pathname;
  const pathWithoutLastPart = pathname.slice(0, pathname.lastIndexOf('/'));
  const customizer = useSelector((state) => state.customizer);
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));
  const hideMenu = lgUp ? customizer.isCollapse && !customizer.isSidebarHover : '';
  const dispatch = useDispatch();

  useEffect(() => {
    try {
      // Set menu items based on user role
      if (user) {
        const role = user.role || 'student';
        const items = getMenuItems(role);
        if (items && items.length > 0) {
          setMenuItems(items);
        }
      }
    } catch (error) {
      console.error('Error setting menu items:', error);
      // Keep using existing menu items on error
    }
  }, [user]);

  // Fallback to default menu items if menuItems becomes empty
  if (!menuItems || menuItems.length === 0) {
    return (
      <Box sx={{ px: 3 }}>
        <List sx={{ pt: 0 }} className="sidebarNav">
          {Menuitems.map((item) => {
            if (item.subheader) {
              return <NavGroup item={item} hideMenu={hideMenu} key={item.subheader} />;
            } else if (item.children) {
              return (
                <NavCollapse
                  menu={item}
                  pathDirect={pathDirect}
                  hideMenu={hideMenu}
                  pathWithoutLastPart={pathWithoutLastPart}
                  level={1}
                  key={item.id}
                  onClick={() => dispatch(toggleMobileSidebar())}
                />
              );
            } else {
              return (
                <NavItem item={item} key={item.id} pathDirect={pathDirect} hideMenu={hideMenu} onClick={() => dispatch(toggleMobileSidebar())} />
              );
            }
          })}
        </List>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 3 }}>
      <List sx={{ pt: 0 }} className="sidebarNav">
        {menuItems.map((item) => {
          // {/********SubHeader**********/}
          if (item.subheader) {
            return <NavGroup item={item} hideMenu={hideMenu} key={item.subheader} />;

            // {/********If Sub Menu**********/}
            /* eslint no-else-return: "off" */
          } else if (item.children) {
            return (
              <NavCollapse
                menu={item}
                pathDirect={pathDirect}
                hideMenu={hideMenu}
                pathWithoutLastPart={pathWithoutLastPart}
                level={1}
                key={item.id}
                onClick={() => dispatch(toggleMobileSidebar())}
              />
            );

            // {/********If Sub No Menu**********/}
          } else {
            return (
              <NavItem item={item} key={item.id} pathDirect={pathDirect} hideMenu={hideMenu} onClick={() => dispatch(toggleMobileSidebar())} />
            );
          }
        })}
      </List>
    </Box>
  );
};
export default SidebarItems;
