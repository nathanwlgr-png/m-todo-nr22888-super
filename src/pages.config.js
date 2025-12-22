import Home from './pages/Home';
import NewClient from './pages/NewClient';
import Clients from './pages/Clients';
import ClientProfile from './pages/ClientProfile';
import PreVisitChecklist from './pages/PreVisitChecklist';
import AIAssistant from './pages/AIAssistant';
import VisitSummary from './pages/VisitSummary';


export const PAGES = {
    "Home": Home,
    "NewClient": NewClient,
    "Clients": Clients,
    "ClientProfile": ClientProfile,
    "PreVisitChecklist": PreVisitChecklist,
    "AIAssistant": AIAssistant,
    "VisitSummary": VisitSummary,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};