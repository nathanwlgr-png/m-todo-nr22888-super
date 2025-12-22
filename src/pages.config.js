import AIAssistant from './pages/AIAssistant';
import Calendar from './pages/Calendar';
import ClientProfile from './pages/ClientProfile';
import Clients from './pages/Clients';
import ClientsByCity from './pages/ClientsByCity';
import CreateFollowUpSequence from './pages/CreateFollowUpSequence';
import Equipment from './pages/Equipment';
import FollowUpAssistant from './pages/FollowUpAssistant';
import FollowUpSequences from './pages/FollowUpSequences';
import GlobalSearch from './pages/GlobalSearch';
import Goals from './pages/Goals';
import GoogleCalendarSettings from './pages/GoogleCalendarSettings';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import NewClient from './pages/NewClient';
import NumerologyAnalysis from './pages/NumerologyAnalysis';
import ObjectionAnalyzer from './pages/ObjectionAnalyzer';
import PerformanceDashboard from './pages/PerformanceDashboard';
import PostVisitAnalysis from './pages/PostVisitAnalysis';
import PreVisitChecklist from './pages/PreVisitChecklist';
import ProspectingScripts from './pages/ProspectingScripts';
import Reports from './pages/Reports';
import SalesFunnel from './pages/SalesFunnel';
import TaskAutomation from './pages/TaskAutomation';
import TaskCalendar from './pages/TaskCalendar';
import Tasks from './pages/Tasks';
import VisitSummary from './pages/VisitSummary';
import Leads from './pages/Leads';
import CaptureLeads from './pages/CaptureLeads';
import ImportLeads from './pages/ImportLeads';
import LeadProfile from './pages/LeadProfile';
import LeadsDashboard from './pages/LeadsDashboard';
import AutomationRules from './pages/AutomationRules';
import WhatsAppInbox from './pages/WhatsAppInbox';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistant": AIAssistant,
    "Calendar": Calendar,
    "ClientProfile": ClientProfile,
    "Clients": Clients,
    "ClientsByCity": ClientsByCity,
    "CreateFollowUpSequence": CreateFollowUpSequence,
    "Equipment": Equipment,
    "FollowUpAssistant": FollowUpAssistant,
    "FollowUpSequences": FollowUpSequences,
    "GlobalSearch": GlobalSearch,
    "Goals": Goals,
    "GoogleCalendarSettings": GoogleCalendarSettings,
    "Home": Home,
    "Leaderboard": Leaderboard,
    "NewClient": NewClient,
    "NumerologyAnalysis": NumerologyAnalysis,
    "ObjectionAnalyzer": ObjectionAnalyzer,
    "PerformanceDashboard": PerformanceDashboard,
    "PostVisitAnalysis": PostVisitAnalysis,
    "PreVisitChecklist": PreVisitChecklist,
    "ProspectingScripts": ProspectingScripts,
    "Reports": Reports,
    "SalesFunnel": SalesFunnel,
    "TaskAutomation": TaskAutomation,
    "TaskCalendar": TaskCalendar,
    "Tasks": Tasks,
    "VisitSummary": VisitSummary,
    "Leads": Leads,
    "CaptureLeads": CaptureLeads,
    "ImportLeads": ImportLeads,
    "LeadProfile": LeadProfile,
    "LeadsDashboard": LeadsDashboard,
    "AutomationRules": AutomationRules,
    "WhatsAppInbox": WhatsAppInbox,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};