
import React from 'react';
import { Link, useLocation, matchPath } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isAdminDashboard = location.pathname === '/admin';
  // ユーザーのスケジュール調整ページかどうかを判定
  // React Router v6ではmatchPathの第二引数はlocation.pathnameではなく、パターンオブジェクトを取る場合があるが、
  // ここではシンプルにpathnameとのマッチングで動作する
  const isUserSchedulePage = !!matchPath("/schedule/:eventId", location.pathname);


  const headerBgColor = isAdminPage ? 'bg-theme-blue-600' : 'bg-theme-pink-600';
  const hoverTextColor = isAdminPage ? 'hover:text-theme-blue-200' : 'hover:text-theme-pink-200';
  const navHoverBgColor = isAdminPage ? 'hover:bg-theme-blue-700' : 'hover:bg-theme-pink-700';

  const titleContent = "🗓️ BEAUTY ROAD スケジュール調整";

  return (
    <header className={`${headerBgColor} text-white shadow-md`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {isUserSchedulePage ? (
          <span className={`text-2xl sm:text-3xl font-bold`}>
            {titleContent}
          </span>
        ) : (
          <Link to="/admin" className={`text-2xl sm:text-3xl font-bold ${hoverTextColor} transition-colors`}>
            {titleContent}
          </Link>
        )}
        <nav>
          {isAdminPage && !isAdminDashboard && (
            <Link
              to="/admin"
              className={`text-sm sm:text-base px-3 py-2 rounded-md ${navHoverBgColor} transition-colors`}
            >
              管理者ダッシュボード
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
