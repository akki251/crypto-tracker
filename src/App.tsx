import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WebSocketProvider } from './context/WebSocketContext';
import { Header } from './components/layout/Header';
import { ProductList } from './components/product-list/ProductList';
import { ProductDetail } from './components/product-detail/ProductDetail';

export default function App() {
  return (
    <BrowserRouter>
      <WebSocketProvider>
        <div className="app" id="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<ProductList />} />
              <Route path="/favorites" element={<ProductList favoritesOnly />} />
              <Route path="/product/:symbol" element={<ProductDetail />} />
            </Routes>
          </main>
        </div>
      </WebSocketProvider>
    </BrowserRouter>
  );
}
