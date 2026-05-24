'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { icon: '📊', label: 'Dashboard', href: '/dashboard' },
  { icon: '🎯', label: 'Meta Ads',   href: '/meta-ads' },
  { icon: '🤖', label: 'Intelligence', href: '/intelligence' },
  { icon: '📦', label: 'Products',   href: '/products' },
  { icon: '📈', label: 'Analytics',  href: '/analytics' },
  { icon: '📁', label: 'Reports',    href: '/reports' },
  { icon: '⚙️', label: 'Settings',  href: '/settings' },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">A</div>
        <span style={{ fontSize: 18, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.04em' }}>
          AdsML
        </span>
      </div>

      <div style={{ padding: '0 20px 8px', fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Main Menu
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const active = path === item.href || path.startsWith(item.href + '/');
          return (
            <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
              <div className={`nav-item${active ? ' active' : ''}`}>
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {active && (
                  <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: '#6366f1' }} />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom card */}
      <div style={{ marginTop: 'auto', padding: '0 12px 8px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
          borderRadius: 14, padding: '16px 18px', color: 'white',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, marginBottom: 4 }}>ML MODEL</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Active & Running</div>
          <div style={{ fontSize: 11.5, opacity: 0.8, lineHeight: 1.4 }}>
            Ad optimization model is analyzing your campaigns
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 8px 4px' }}>
          <div className="user-avatar" style={{ width: 34, height: 34, fontSize: 13 }}>A</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Abid</div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Administrator</div>
          </div>
          <div style={{ marginLeft: 'auto', cursor: 'pointer', color: '#94a3b8', fontSize: 16 }}>↗</div>
        </div>
      </div>
    </aside>
  );
}
