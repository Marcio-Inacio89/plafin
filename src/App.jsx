import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { FinanceProvider } from './context/FinanceContext'
import LandingPage from './screens/LandingPage'
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import ForgotPasswordScreen from './screens/ForgotPasswordScreen'
import HomeScreen from './screens/HomeScreen'
import ProjecaoScreen from './screens/ProjecaoScreen'
import GraficoScreen from './screens/GraficoScreen'
import AddTransactionModal from './components/AddTransactionModal'
import PDFImportModal from './components/PDFImportModal'
import SideMenu from './components/SideMenu'

const titles = {
  home: 'Plafin',
  projecao: 'Projeção Mensal',
  grafico: 'Saldo Futuro',
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true
}

function MainApp() {
  const { signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('home')
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [showSideMenu, setShowSideMenu] = useState(false)
  const [showPDFImport, setShowPDFImport] = useState(false)

  const hoje = new Date()
  const [mesSel, setMesSel] = useState(hoje.getMonth())
  const [anoSel, setAnoSel] = useState(hoje.getFullYear())

  const openAdd = () => {
    setEditData(null)
    setShowModal(true)
  }

  const openEdit = (transaction) => {
    setEditData(transaction)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditData(null)
  }

  const openPDFImport = () => {
    setShowModal(false)
    setEditData(null)
    setShowPDFImport(true)
  }

  return (
    <FinanceProvider>
      <div className="app">
        <header className="app-header">
          <button className="hamburger-btn" onClick={() => setShowSideMenu(true)}>
            <span /><span /><span />
          </button>
          <h1>{titles[activeTab]}</h1>
          <button className="header-logout" onClick={signOut} title="Sair">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 17H4a1 1 0 01-1-1V4a1 1 0 011-1h3M13 14l4-4-4-4M17 10H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </header>

        <main className="app-content">
          {activeTab === 'home' && (
            <HomeScreen
              mesSel={mesSel} setMesSel={setMesSel}
              anoSel={anoSel} setAnoSel={setAnoSel}
              onEditTransaction={openEdit}
            />
          )}
          {activeTab === 'projecao' && <ProjecaoScreen />}
          {activeTab === 'grafico' && <GraficoScreen />}
        </main>

        <nav className="tab-bar">
          <button
            className={`tab-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <span className="tab-icon">🏠</span>
            <span className="tab-label">Início</span>
          </button>
          <button
            className={`tab-item ${activeTab === 'projecao' ? 'active' : ''}`}
            onClick={() => setActiveTab('projecao')}
          >
            <span className="tab-icon">📋</span>
            <span className="tab-label">Projeção</span>
          </button>
          <div className="fab-wrapper">
            <button className="fab-button" onClick={openAdd}>
              <span>+</span>
            </button>
          </div>
          <button
            className={`tab-item ${activeTab === 'grafico' ? 'active' : ''}`}
            onClick={() => setActiveTab('grafico')}
          >
            <span className="tab-icon">📊</span>
            <span className="tab-label">Gráfico</span>
          </button>
        </nav>

        {showModal && (
          <AddTransactionModal
            onClose={closeModal}
            editData={editData}
            mesSelecionado={mesSel}
            anoSelecionado={anoSel}
            onOpenPDFImport={openPDFImport}
          />
        )}

        {showPDFImport && (
          <PDFImportModal
            onClose={() => setShowPDFImport(false)}
            mesSelecionado={mesSel}
            anoSelecionado={anoSel}
          />
        )}

        {showSideMenu && <SideMenu onClose={() => setShowSideMenu(false)} />}
      </div>
    </FinanceProvider>
  )
}

function AuthGate() {
  const { user, loading } = useAuth()
  const [authScreen, setAuthScreen] = useState('login')
  const [skipLanding, setSkipLanding] = useState(isStandalone)

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
        <p>Carregando...</p>
      </div>
    )
  }

  if (user) {
    return <MainApp />
  }

  if (!skipLanding) {
    return <LandingPage onContinue={() => setSkipLanding(true)} />
  }

  if (authScreen === 'register') {
    return <RegisterScreen onGoLogin={() => setAuthScreen('login')} />
  }

  if (authScreen === 'forgot') {
    return <ForgotPasswordScreen onGoLogin={() => setAuthScreen('login')} />
  }

  return (
    <LoginScreen
      onGoRegister={() => setAuthScreen('register')}
      onGoForgot={() => setAuthScreen('forgot')}
    />
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}
