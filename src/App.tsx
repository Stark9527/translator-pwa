import { BrowserRouter as Router } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-8">
          <h1 className="text-4xl font-bold text-center mb-8">
            智能翻译助手 PWA
          </h1>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              项目初始化完成！接下来我们将：
            </p>
            <ul className="text-left max-w-md mx-auto space-y-2">
              <li>✅ 创建项目基础结构</li>
              <li>✅ 配置构建工具</li>
              <li>⏳ 复用服务层代码</li>
              <li>⏳ 创建 UI 组件</li>
              <li>⏳ 实现 PWA 功能</li>
            </ul>
            <div className="mt-8 p-4 bg-primary/10 rounded-lg">
              <p className="text-sm">
                💡 提示：运行 <code className="bg-muted px-2 py-1 rounded">npm install</code> 安装依赖后，
                使用 <code className="bg-muted px-2 py-1 rounded">npm run dev</code> 启动开发服务器
              </p>
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
