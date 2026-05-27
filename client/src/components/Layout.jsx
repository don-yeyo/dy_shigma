import React, { useState } from 'react';
import Header from './Header';
import Drawer from './Drawer';
import { useTheme } from '../config/ThemeContext';

const Layout = ({ children }) => {
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="layout">
            <Header
                onMenuClick={() => setDrawerOpen(true)}
                theme={theme}
                toggleTheme={toggleTheme}
            />
            <Drawer
                isOpen={isDrawerOpen}
                onClose={() => setDrawerOpen(false)}
            />
            <main className="content">
                {children}
            </main>
        </div>
    );
};

export default Layout;
