import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import MoviePage from './pages/MoviePage.jsx';
import UserPage from './pages/UserPage.jsx';
import Header from './components/Header';
import {Box, CssBaseline, ThemeProvider} from "@mui/material";
import darkTheme from "./theme/theme.jsx";
import CreateMoviePage from "./pages/CreatMoviePage.jsx";
import SearchPage from './pages/SearchPage.jsx';
import LivePage from './pages/LivePage.jsx';
import LiveStreamPage from './pages/LiveStreamPage.jsx';

function App() {
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Router>
                <Header />
                <Box sx={{ marginTop: '64px' }}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/movie/:id" element={<MoviePage />} />
                        <Route path="/user" element={<UserPage />} />
                        <Route path="/user/upload" element={<CreateMoviePage />} />
                        <Route path="/movie/search/:hashtag" element={<SearchPage />} />
                        <Route path="/live" element={<LivePage />} />
                        <Route path="/live/:id" element={<LiveStreamPage />} />
                    </Routes>
                </Box>
            </Router>
        </ThemeProvider>
    );
}

export default App;
