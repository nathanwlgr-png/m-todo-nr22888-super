/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIAssistant from './pages/AIAssistant';
import AIContentGenerator from './pages/AIContentGenerator';
import AIContentStudio from './pages/AIContentStudio';
import AIFollowUpSequences from './pages/AIFollowUpSequences';
import AIKnowledgeUploader from './pages/AIKnowledgeUploader';
import AdvancedAIReports from './pages/AdvancedAIReports';
import AdvancedFunnelManager from './pages/AdvancedFunnelManager';
import AdvancedReports from './pages/AdvancedReports';
import AdvancedSalesReports from './pages/AdvancedSalesReports';
import AutoFollowUpDashboard from './pages/AutoFollowUpDashboard';
import AutomationManager from './pages/AutomationManager';
import AutomationRules from './pages/AutomationRules';
import AutomationSettings from './pages/AutomationSettings';
import CRMAnalyticsDashboard from './pages/CRMAnalyticsDashboard';
import Calendar from './pages/Calendar';
import CampaignCenter from './pages/CampaignCenter';
import CampaignDemo from './pages/CampaignDemo';
import CampaignDetails from './pages/CampaignDetails';
import CampaignTemplatesDemo from './pages/CampaignTemplatesDemo';
import Campaigns from './pages/Campaigns';
import CaptureLeads from './pages/CaptureLeads';
import ChurnAnalysis from './pages/ChurnAnalysis';
import ClientDashboard from './pages/ClientDashboard';
import ClientDocumentCenter from './pages/ClientDocumentCenter';
import ClientProfile from './pages/ClientProfile';
import ClientSegmentation from './pages/ClientSegmentation';
import Clients from './pages/Clients';
import ClientsByCity from './pages/ClientsByCity';
import ClientsMap from './pages/ClientsMap';
import ClosingForecast from './pages/ClosingForecast';
import ConsumableOrderHistory from './pages/ConsumableOrderHistory';
import ConsumablePriceList from './pages/ConsumablePriceList';
import ContactSettings from './pages/ContactSettings';
import CreateFollowUpSequence from './pages/CreateFollowUpSequence';
import CustomDashboard from './pages/CustomDashboard';
import DailyReports from './pages/DailyReports';
import Dashboard from './pages/Dashboard';
import DataHub from './pages/DataHub';
import DocumentCenter from './pages/DocumentCenter';
import DocumentRepository from './pages/DocumentRepository';
import DocumentTracking from './pages/DocumentTracking';
import Equipment from './pages/Equipment';
import EquipmentCatalog from './pages/EquipmentCatalog';
import EquipmentCatalogManager from './pages/EquipmentCatalogManager';
import EquipmentComparison from './pages/EquipmentComparison';
import EquipmentConsumables from './pages/EquipmentConsumables';
import EquipmentPriceList from './pages/EquipmentPriceList';
import EquipmentSalesCenter from './pages/EquipmentSalesCenter';
import ExportedDocuments from './pages/ExportedDocuments';
import FollowUpAssistant from './pages/FollowUpAssistant';
import FollowUpSequences from './pages/FollowUpSequences';
import FunnelOptimization from './pages/FunnelOptimization';
import GlobalSearch from './pages/GlobalSearch';
import Goals from './pages/Goals';
import GoogleCalendarSettings from './pages/GoogleCalendarSettings';
import HemogasEquineGuide from './pages/HemogasEquineGuide';
import Home from './pages/Home';
import ImportClientsTable from './pages/ImportClientsTable';
import ImportLeads from './pages/ImportLeads';
import ImportPriceList from './pages/ImportPriceList';
import Integrations from './pages/Integrations';
import InteractiveDashboard from './pages/InteractiveDashboard';
import KnowledgeBaseManager from './pages/KnowledgeBaseManager';
import LeadProfile from './pages/LeadProfile';
import Leaderboard from './pages/Leaderboard';
import Leads from './pages/Leads';
import LeadsDashboard from './pages/LeadsDashboard';
import LeadsKanban from './pages/LeadsKanban';
import LoadEquipmentCatalog from './pages/LoadEquipmentCatalog';
import LoadPremiumDifferentials from './pages/LoadPremiumDifferentials';
import MarketIntelligence from './pages/MarketIntelligence';
import MarketResearch from './pages/MarketResearch';
import MessageApproval from './pages/MessageApproval';
import MessageHistory from './pages/MessageHistory';
import MobVendedorAnalytics from './pages/MobVendedorAnalytics';
import MobVendedorBackup from './pages/MobVendedorBackup';
import MobVendedorDashboard from './pages/MobVendedorDashboard';
import MobiMigration from './pages/MobiMigration';
import MonthlyReport from './pages/MonthlyReport';
import MonthlyVisitPlanner from './pages/MonthlyVisitPlanner';
import MyProfile from './pages/MyProfile';
import NewCampaign from './pages/NewCampaign';
import NewClient from './pages/NewClient';
import NotificationSettings from './pages/NotificationSettings';
import NumerologyAnalysis from './pages/NumerologyAnalysis';
import ObjectionAnalyzer from './pages/ObjectionAnalyzer';
import OfflineAnalytics from './pages/OfflineAnalytics';
import OfflineMode from './pages/OfflineMode';
import Onboarding from './pages/Onboarding';
import PartyStoresProspecting from './pages/PartyStoresProspecting';
import PerformanceDashboard from './pages/PerformanceDashboard';
import PossibleSales from './pages/PossibleSales';
import PostVisitAnalysis from './pages/PostVisitAnalysis';
import PreVisitChecklist from './pages/PreVisitChecklist';
import PredictiveAnalyticsDashboard from './pages/PredictiveAnalyticsDashboard';
import ProactiveIntelligenceDashboard from './pages/ProactiveIntelligenceDashboard';
import ProductManager from './pages/ProductManager';
import ProposalGenerator from './pages/ProposalGenerator';
import ProposalTemplateManager from './pages/ProposalTemplateManager';
import ProposalTemplates from './pages/ProposalTemplates';
import ProspectingScripts from './pages/ProspectingScripts';
import RealtimeSalesFunnel from './pages/RealtimeSalesFunnel';
import RegionalCompetitorAnalysis from './pages/RegionalCompetitorAnalysis';
import RegionalSearch from './pages/RegionalSearch';
import Reports from './pages/Reports';
import ReportsAdvanced from './pages/ReportsAdvanced';
import ReportsAutomation from './pages/ReportsAutomation';
import RevenueForecastPage from './pages/RevenueForecastPage';
import RolePlayTraining from './pages/RolePlayTraining';
import RouteOptimizer from './pages/RouteOptimizer';
import SalesAnalytics from './pages/SalesAnalytics';
import SalesAnalyticsDashboard from './pages/SalesAnalyticsDashboard';
import SalesCoaching from './pages/SalesCoaching';
import SalesCoachingDashboard from './pages/SalesCoachingDashboard';
import SalesForecastPage from './pages/SalesForecastPage';
import SalesFunnel from './pages/SalesFunnel';
import SalesPerformanceDashboard from './pages/SalesPerformanceDashboard';
import SalesReportsAI from './pages/SalesReportsAI';
import ScheduledAgenda from './pages/ScheduledAgenda';
import SentimentDashboard from './pages/SentimentDashboard';
import SignedContracts from './pages/SignedContracts';
import SystemAudit from './pages/SystemAudit';
import TaskAutomation from './pages/TaskAutomation';
import TaskCalendar from './pages/TaskCalendar';
import Tasks from './pages/Tasks';
import TasksUnified from './pages/TasksUnified';
import TeamPerformanceAnalytics from './pages/TeamPerformanceAnalytics';
import TechnicalMaterialsHub from './pages/TechnicalMaterialsHub';
import VQ1PanelPricing from './pages/VQ1PanelPricing';
import VisitManager from './pages/VisitManager';
import VisitPlanner from './pages/VisitPlanner';
import VisitSummary from './pages/VisitSummary';
import VisitWorkflow from './pages/VisitWorkflow';
import VoiceClientScanner from './pages/VoiceClientScanner';
import WhatsAppDataAccess from './pages/WhatsAppDataAccess';
import WhatsAppHub from './pages/WhatsAppHub';
import WhatsAppInbox from './pages/WhatsAppInbox';
import WhatsAppMasterAssistant from './pages/WhatsAppMasterAssistant';
import WorkflowAutomation from './pages/WorkflowAutomation';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistant": AIAssistant,
    "AIContentGenerator": AIContentGenerator,
    "AIContentStudio": AIContentStudio,
    "AIFollowUpSequences": AIFollowUpSequences,
    "AIKnowledgeUploader": AIKnowledgeUploader,
    "AdvancedAIReports": AdvancedAIReports,
    "AdvancedFunnelManager": AdvancedFunnelManager,
    "AdvancedReports": AdvancedReports,
    "AdvancedSalesReports": AdvancedSalesReports,
    "AutoFollowUpDashboard": AutoFollowUpDashboard,
    "AutomationManager": AutomationManager,
    "AutomationRules": AutomationRules,
    "AutomationSettings": AutomationSettings,
    "CRMAnalyticsDashboard": CRMAnalyticsDashboard,
    "Calendar": Calendar,
    "CampaignCenter": CampaignCenter,
    "CampaignDemo": CampaignDemo,
    "CampaignDetails": CampaignDetails,
    "CampaignTemplatesDemo": CampaignTemplatesDemo,
    "Campaigns": Campaigns,
    "CaptureLeads": CaptureLeads,
    "ChurnAnalysis": ChurnAnalysis,
    "ClientDashboard": ClientDashboard,
    "ClientDocumentCenter": ClientDocumentCenter,
    "ClientProfile": ClientProfile,
    "ClientSegmentation": ClientSegmentation,
    "Clients": Clients,
    "ClientsByCity": ClientsByCity,
    "ClientsMap": ClientsMap,
    "ClosingForecast": ClosingForecast,
    "ConsumableOrderHistory": ConsumableOrderHistory,
    "ConsumablePriceList": ConsumablePriceList,
    "ContactSettings": ContactSettings,
    "CreateFollowUpSequence": CreateFollowUpSequence,
    "CustomDashboard": CustomDashboard,
    "DailyReports": DailyReports,
    "Dashboard": Dashboard,
    "DataHub": DataHub,
    "DocumentCenter": DocumentCenter,
    "DocumentRepository": DocumentRepository,
    "DocumentTracking": DocumentTracking,
    "Equipment": Equipment,
    "EquipmentCatalog": EquipmentCatalog,
    "EquipmentCatalogManager": EquipmentCatalogManager,
    "EquipmentComparison": EquipmentComparison,
    "EquipmentConsumables": EquipmentConsumables,
    "EquipmentPriceList": EquipmentPriceList,
    "EquipmentSalesCenter": EquipmentSalesCenter,
    "ExportedDocuments": ExportedDocuments,
    "FollowUpAssistant": FollowUpAssistant,
    "FollowUpSequences": FollowUpSequences,
    "FunnelOptimization": FunnelOptimization,
    "GlobalSearch": GlobalSearch,
    "Goals": Goals,
    "GoogleCalendarSettings": GoogleCalendarSettings,
    "HemogasEquineGuide": HemogasEquineGuide,
    "Home": Home,
    "ImportClientsTable": ImportClientsTable,
    "ImportLeads": ImportLeads,
    "ImportPriceList": ImportPriceList,
    "Integrations": Integrations,
    "InteractiveDashboard": InteractiveDashboard,
    "KnowledgeBaseManager": KnowledgeBaseManager,
    "LeadProfile": LeadProfile,
    "Leaderboard": Leaderboard,
    "Leads": Leads,
    "LeadsDashboard": LeadsDashboard,
    "LeadsKanban": LeadsKanban,
    "LoadEquipmentCatalog": LoadEquipmentCatalog,
    "LoadPremiumDifferentials": LoadPremiumDifferentials,
    "MarketIntelligence": MarketIntelligence,
    "MarketResearch": MarketResearch,
    "MessageApproval": MessageApproval,
    "MessageHistory": MessageHistory,
    "MobVendedorAnalytics": MobVendedorAnalytics,
    "MobVendedorBackup": MobVendedorBackup,
    "MobVendedorDashboard": MobVendedorDashboard,
    "MobiMigration": MobiMigration,
    "MonthlyReport": MonthlyReport,
    "MonthlyVisitPlanner": MonthlyVisitPlanner,
    "MyProfile": MyProfile,
    "NewCampaign": NewCampaign,
    "NewClient": NewClient,
    "NotificationSettings": NotificationSettings,
    "NumerologyAnalysis": NumerologyAnalysis,
    "ObjectionAnalyzer": ObjectionAnalyzer,
    "OfflineAnalytics": OfflineAnalytics,
    "OfflineMode": OfflineMode,
    "Onboarding": Onboarding,
    "PartyStoresProspecting": PartyStoresProspecting,
    "PerformanceDashboard": PerformanceDashboard,
    "PossibleSales": PossibleSales,
    "PostVisitAnalysis": PostVisitAnalysis,
    "PreVisitChecklist": PreVisitChecklist,
    "PredictiveAnalyticsDashboard": PredictiveAnalyticsDashboard,
    "ProactiveIntelligenceDashboard": ProactiveIntelligenceDashboard,
    "ProductManager": ProductManager,
    "ProposalGenerator": ProposalGenerator,
    "ProposalTemplateManager": ProposalTemplateManager,
    "ProposalTemplates": ProposalTemplates,
    "ProspectingScripts": ProspectingScripts,
    "RealtimeSalesFunnel": RealtimeSalesFunnel,
    "RegionalCompetitorAnalysis": RegionalCompetitorAnalysis,
    "RegionalSearch": RegionalSearch,
    "Reports": Reports,
    "ReportsAdvanced": ReportsAdvanced,
    "ReportsAutomation": ReportsAutomation,
    "RevenueForecastPage": RevenueForecastPage,
    "RolePlayTraining": RolePlayTraining,
    "RouteOptimizer": RouteOptimizer,
    "SalesAnalytics": SalesAnalytics,
    "SalesAnalyticsDashboard": SalesAnalyticsDashboard,
    "SalesCoaching": SalesCoaching,
    "SalesCoachingDashboard": SalesCoachingDashboard,
    "SalesForecastPage": SalesForecastPage,
    "SalesFunnel": SalesFunnel,
    "SalesPerformanceDashboard": SalesPerformanceDashboard,
    "SalesReportsAI": SalesReportsAI,
    "ScheduledAgenda": ScheduledAgenda,
    "SentimentDashboard": SentimentDashboard,
    "SignedContracts": SignedContracts,
    "SystemAudit": SystemAudit,
    "TaskAutomation": TaskAutomation,
    "TaskCalendar": TaskCalendar,
    "Tasks": Tasks,
    "TasksUnified": TasksUnified,
    "TeamPerformanceAnalytics": TeamPerformanceAnalytics,
    "TechnicalMaterialsHub": TechnicalMaterialsHub,
    "VQ1PanelPricing": VQ1PanelPricing,
    "VisitManager": VisitManager,
    "VisitPlanner": VisitPlanner,
    "VisitSummary": VisitSummary,
    "VisitWorkflow": VisitWorkflow,
    "VoiceClientScanner": VoiceClientScanner,
    "WhatsAppDataAccess": WhatsAppDataAccess,
    "WhatsAppHub": WhatsAppHub,
    "WhatsAppInbox": WhatsAppInbox,
    "WhatsAppMasterAssistant": WhatsAppMasterAssistant,
    "WorkflowAutomation": WorkflowAutomation,
}

export const pagesConfig = {
    mainPage: "AIAssistant",
    Pages: PAGES,
    Layout: __Layout,
};