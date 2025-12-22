import AIAssistant from './pages/AIAssistant';
import Calendar from './pages/Calendar';
import ClientProfile from './pages/ClientProfile';
import Clients from './pages/Clients';
import ClientsByCity from './pages/ClientsByCity';
import Equipment from './pages/Equipment';
import FollowUpAssistant from './pages/FollowUpAssistant';
import GlobalSearch from './pages/GlobalSearch';
import GoogleCalendarSettings from './pages/GoogleCalendarSettings';
import Home from './pages/Home';
import NewClient from './pages/NewClient';
import PreVisitChecklist from './pages/PreVisitChecklist';
import Reports from './pages/Reports';
import Tasks from './pages/Tasks';
import VisitSummary from './pages/VisitSummary';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistant": AIAssistant,
    "Calendar": Calendar,
    "ClientProfile": ClientProfile,
    "Clients": Clients,
    "ClientsByCity": ClientsByCity,
    "Equipment": Equipment,
    "FollowUpAssistant": FollowUpAssistant,
    "GlobalSearch": GlobalSearch,
    "GoogleCalendarSettings": GoogleCalendarSettings,
    "Home": Home,
    "NewClient": NewClient,
    "PreVisitChecklist": PreVisitChecklist,
    "Reports": Reports,
    "Tasks": Tasks,
    "VisitSummary": VisitSummary,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};