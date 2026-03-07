import React, { useState } from 'react'
import { FinanceProvider } from './context/FinanceContext'
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

function AppContent() {
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
    <div className="app">
      <header className="app-header">
        <button className="hamburger-btn" onClick={() => setShowSideMenu(true)}>
          <span /><span /><span />
        </button>
        <h1>{titles[activeTab]}</h1>
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
  )
}

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  )
}
