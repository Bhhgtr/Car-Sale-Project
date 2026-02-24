import {BrowserRouter, Routes, Route} from 'react-router-dom';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';

<BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/about" element={<Home />} />
        <Route path="/profile" element={<Home />} />
      </Routes>
    </BrowserRouter>