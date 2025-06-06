import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10">
      <img src="https://picsum.photos/seed/404page/400/300" alt="Lost and Confused" className="w-64 h-auto rounded-lg shadow-lg mb-8" />
      <h1 className="text-6xl font-bold text-theme-pink-600 mb-4">404</h1>
      <p className="text-2xl text-slate-700 mb-6">ページが見つかりませんでした。</p>
      <p className="text-slate-500 mb-8">お探しのページは移動または削除された可能性があります。</p>
      <Link to="/admin">
        <Button variant="primary" size="lg" colorScheme="pink">
          管理者ダッシュボードに戻る
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;