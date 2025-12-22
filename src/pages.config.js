import AIAssistant from './pages/AIAssistant';
import ClientProfile from './pages/ClientProfile';
import Clients from './pages/Clients';
import ClientsByCity from './pages/ClientsByCity';
import Home from './pages/Home';
import NewClient from './pages/NewClient';
import PreVisitChecklist from './pages/PreVisitChecklist';
import VisitSummary from './pages/VisitSummary';
import Equipment from './pages/Equipment';
import Reports from './pages/Reports';
import Calendar from './pages/Calendar';
import GoogleCalendarSettings from './pages/GoogleCalendarSettings';
import FollowUpAssistant from './pages/FollowUpAssistant';
import GlobalSearch from './pages/GlobalSearch';
import Tasks from './pages/Tasks';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistant": AIAssistant,
    "ClientProfile": ClientProfile,
    "Clients": Clients,
    "ClientsByCity": ClientsByCity,
    "Home": Home,
    "NewClient": NewClient,
    "PreVisitChecklist": PreVisitChecklist,
    "VisitSummary": VisitSummary,
    "Equipment": Equipment,
    "Reports": Reports,
    "Calendar": Calendar,
    "GoogleCalendarSettings": GoogleCalendarSettings,
    "FollowUpAssistant": FollowUpAssistant,
    "GlobalSearch": GlobalSearch,
    "Tasks": Tasks,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};