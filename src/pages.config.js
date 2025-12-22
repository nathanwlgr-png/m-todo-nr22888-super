import AIAssistant from './pages/AIAssistant';
import ClientProfile from './pages/ClientProfile';
import Clients from './pages/Clients';
import Home from './pages/Home';
import NewClient from './pages/NewClient';
import PreVisitChecklist from './pages/PreVisitChecklist';
import VisitSummary from './pages/VisitSummary';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistant": AIAssistant,
    "ClientProfile": ClientProfile,
    "Clients": Clients,
    "Home": Home,
    "NewClient": NewClient,
    "PreVisitChecklist": PreVisitChecklist,
    "VisitSummary": VisitSummary,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};