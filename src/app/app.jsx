"use client";
import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import RTL from "@/app/(DashboardLayout)/layout/shared/customizer/RTL";
import { ThemeSettings } from "@/utils/theme/Theme";
import { AuthMiddleware } from "./middleware";
import AuthProvider from "./context/AuthContext";

import { useSelector } from 'react-redux';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import "@/utils/i18n";
import "@/app/api/index";

const MyApp = ({ children }) => {
    const theme = ThemeSettings();
    const customizer = useSelector((state) => state.customizer);

    return (
        <>
            <AppRouterCacheProvider options={{ enableCssLayer: true }}>
                <ThemeProvider theme={theme}>
                    <RTL direction={customizer.activeDir}>
                        <CssBaseline />
                        <AuthProvider>
                            <AuthMiddleware>
                                {children}
                            </AuthMiddleware>
                        </AuthProvider>
                    </RTL>
                </ThemeProvider>
            </AppRouterCacheProvider>
        </>
    );
};

export default MyApp;