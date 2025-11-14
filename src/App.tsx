import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { TranslatePage } from './pages/TranslatePage';
import { LoginPage } from './pages/LoginPage';
import { SettingsPage } from './pages/SettingsPage';
import FlashcardListPage from './pages/flashcard/FlashcardListPage';
import StudyPage from './pages/flashcard/StudyPage';
import StatisticsPage from './pages/flashcard/StatisticsPage';
import GroupManagePage from './pages/flashcard/GroupManagePage';
import { useTheme } from './hooks/useTheme';

function App() {
  // 应用主题管理
  useTheme();

  return (
    <Router>
      <Routes>
        {/* 登录页面（独立布局） */}
        <Route path="/login" element={<LoginPage />} />

        {/* 主应用布局 */}
        <Route element={<AppLayout />}>
          {/* 翻译页面（主页） */}
          <Route path="/" element={<TranslatePage />} />

          {/* Flashcard 相关页面 */}
          <Route path="/flashcards" element={<FlashcardListPage />} />
          <Route path="/flashcards/study" element={<StudyPage />} />
          <Route path="/flashcards/groups" element={<GroupManagePage />} />

          {/* 统计页面 */}
          <Route path="/statistics" element={<StatisticsPage />} />

          {/* 设置页面 */}
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
