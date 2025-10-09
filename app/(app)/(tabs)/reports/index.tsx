import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Download } from 'lucide-react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { styles } from './styles';

// --- MOCK DATA ---
const reservationsData = {
  labels: ['Salão', 'Churrasq.', 'Quadra', 'Piscina'],
  datasets: [{ data: [24, 18, 32, 15] }]
};
const issuesDataPie = [
  { name: 'Manutenção', population: 45, color: '#ff6b6b', legendFontColor: '#1f2937', legendFontSize: 12 },
  { name: 'Segurança', population: 23, color: '#ffd93d', legendFontColor: '#1f2937', legendFontSize: 12 },
  { name: 'Limpeza', population: 15, color: '#6bcf7f', legendFontColor: '#1f2937', legendFontSize: 12 },
  { name: 'Infra', population: 17, color: '#4ecdc4', legendFontColor: '#1f2937', legendFontSize: 12 },
];
const monthlyReservations = {
  labels: ['Mai', 'Jun', 'Jul', 'Ago', 'Set'],
  datasets: [{ data: [55, 67, 72, 68, 59] }]
};
const monthlyIssues = {
  labels: ['Mai', 'Jun', 'Jul', 'Ago', 'Set'],
  datasets: [{ data: [11, 9, 7, 13, 10] }]
};
const financialSummary = { 
  totalRevenue: 8320, 
  maintenance: 3200, 
  security: 1800, 
  cleaning: 950, 
  other: 1200, 
};

// --- INTERFACES DE TIPAGEM ---
interface TabButtonProps {
  title: string;
  isActive: boolean;
  onPress: () => void;
}
interface FinancialStatBoxProps {
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
  decimalPlaces: 0,
  propsForLabels: {
    fontSize: 11,
  }
};
const chartConfigRed = {
  ...chartConfig,
  color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
};

// --- COMPONENTE PRINCIPAL ---
export default function ReportsScreen() {
    const [activeTab, setActiveTab] = useState('Reservas');
    const [selectedPeriod, setSelectedPeriod] = useState('month');

    // --- LÓGICA DE EXPORTAÇÃO COMPLETA ---

    const generateReservationsHtml = () => {
        let content = '<h2>Reservas por Área</h2><ul>';
        reservationsData.labels.forEach((label, index) => {
            content += `<li><strong>${label}:</strong> ${reservationsData.datasets[0].data[index]} reservas</li>`;
        });
        content += '</ul>';
        return content;
    };

    const generateIssuesHtml = () => {
        let content = '<h2>Distribuição de Ocorrências por Tipo</h2><ul>';
        issuesDataPie.forEach(item => {
            content += `<li><strong>${item.name}:</strong> ${item.population} ocorrências</li>`;
        });
        content += '</ul>';
        return content;
    };

    const generateFinancialHtml = () => {
        let content = '<h2>Resumo Financeiro</h2><ul>';
        content += `<li><strong>Receita Total:</strong> R$ ${financialSummary.totalRevenue.toLocaleString('pt-BR')}</li>`;
        content += `<li><strong>Despesas (Manutenção):</strong> R$ ${financialSummary.maintenance.toLocaleString('pt-BR')}</li>`;
        const totalDespesas = financialSummary.maintenance + financialSummary.security + financialSummary.cleaning + financialSummary.other;
        const saldo = financialSummary.totalRevenue - totalDespesas;
        content += `<li><strong>Saldo:</strong> R$ ${saldo.toLocaleString('pt-BR')}</li>`;
        content += '</ul>';
        return content;
    };
    
    const generateReportHtml = (reportType: 'current' | 'all') => {
        const period = selectedPeriod === 'month' ? 'Este Mês' : 'Este Ano';
        const date = new Date().toLocaleDateString('pt-BR');
        let reportContent = '';
        let title = `Relatório de ${activeTab}`;

        if (reportType === 'all') {
            title = 'Relatório Geral do Condomínio';
            reportContent += generateReservationsHtml();
            reportContent += generateIssuesHtml();
            reportContent += generateFinancialHtml();
        } else {
            if (activeTab === 'Reservas') reportContent = generateReservationsHtml();
            if (activeTab === 'Ocorrências') reportContent = generateIssuesHtml();
            if (activeTab === 'Financeiro') reportContent = generateFinancialHtml();
        }

        return `
            <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                    <style>
                        body { font-family: sans-serif; padding: 20px; color: #374151; }
                        h1 { color: #1e3a8a; }
                        h2 { color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-top: 25px; }
                        ul { list-style: none; padding-left: 0; }
                        li { background-color: #f9fafb; padding: 10px; border-radius: 6px; margin-bottom: 6px; border: 1px solid #f3f4f6; }
                        strong { color: #1f2937; }
                    </style>
                </head>
                <body>
                    <h1>${title}</h1>
                    <p><strong>Período:</strong> ${period}</p>
                    <p><strong>Gerado em:</strong> ${date}</p>
                    ${reportContent}
                </body>
            </html>
        `;
    };
    
    const exportAsPdf = async (reportType: 'current' | 'all') => {
        try {
            const htmlContent = generateReportHtml(reportType);
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar Relatório' });
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível gerar o PDF.');
        }
    };
    
    const handleExportReport = () => {
        Alert.alert(
            'Exportar Relatório',
            `Escolha uma opção:`,
            [
                { text: `Gerar PDF da Aba "${activeTab}"`, onPress: () => exportAsPdf('current') },
                { text: 'Gerar Relatório Completo (PDF)', onPress: () => exportAsPdf('all') },
                { text: 'Cancelar', style: 'cancel' },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Relatórios</Text>
                    <Text style={styles.headerSubtitle}>Análises e estatísticas do condomínio</Text>
                </View>
                
                <View style={styles.filterContainer}>
                    <View style={styles.pickerWrapper}>
                        <View style={styles.pickerContainer}>
                            <Picker 
                                selectedValue={selectedPeriod} 
                                onValueChange={(value) => setSelectedPeriod(value)} 
                                style={styles.picker}
                            >
                                <Picker.Item label="Este Mês" value="month" />
                                <Picker.Item label="Este Ano" value="year" />
                            </Picker>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.exportButton} onPress={handleExportReport}>
                        <Download size={18} color="#3b82f6" style={styles.exportIcon} />
                        <Text style={styles.exportButtonText}>Exportar</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.tabsContainer}
                >
                    <TabButton title="Reservas" isActive={activeTab === 'Reservas'} onPress={() => setActiveTab('Reservas')} />
                    <TabButton title="Ocorrências" isActive={activeTab === 'Ocorrências'} onPress={() => setActiveTab('Ocorrências')} />
                    <TabButton title="Financeiro" isActive={activeTab === 'Financeiro'} onPress={() => setActiveTab('Financeiro')} />
                </ScrollView>

                {activeTab === 'Reservas' && <ReservationsReport />}
                {activeTab === 'Ocorrências' && <IssuesReport />}
                {activeTab === 'Financeiro' && <FinancialReport />}
            </ScrollView>
        </SafeAreaView>
    );
}

// --- Subcomponentes ---
const TabButton: React.FC<TabButtonProps> = ({ title, isActive, onPress }) => (
    <TouchableOpacity 
        style={[styles.tab, isActive && styles.activeTab]} 
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>{title}</Text>
    </TouchableOpacity>
);

const ReservationsReport: React.FC = () => (
    <View style={styles.tabContent}>
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Reservas por Área</Text>
            </View>
            <View style={styles.cardContent}>
                <BarChart 
                    data={reservationsData} 
                    width={screenWidth - 64} 
                    height={220} 
                    yAxisLabel="" 
                    yAxisSuffix="" 
                    chartConfig={chartConfig} 
                    style={styles.chart} 
                    fromZero 
                    showValuesOnTopOfBars 
                />
            </View>
        </View>
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Tendência Mensal de Reservas</Text>
            </View>
            <View style={styles.cardContent}>
                <LineChart 
                    data={monthlyReservations} 
                    width={screenWidth - 64} 
                    height={220} 
                    chartConfig={chartConfig} 
                    bezier 
                    style={styles.chart} 
                />
            </View>
        </View>
    </View>
);

const IssuesReport: React.FC = () => (
    <View style={styles.tabContent}>
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Distribuição por Tipo</Text>
            </View>
            <View style={[styles.cardContent, styles.pieChartContainer]}>
                <PieChart 
                    data={issuesDataPie} 
                    width={screenWidth - 64} 
                    height={200} 
                    chartConfig={chartConfig} 
                    accessor="population" 
                    backgroundColor="transparent" 
                    paddingLeft="15" 
                    absolute 
                />
            </View>
        </View>
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Tendência de Ocorrências</Text>
            </View>
            <View style={styles.cardContent}>
                <LineChart 
                    data={monthlyIssues} 
                    width={screenWidth - 64} 
                    height={220} 
                    chartConfig={chartConfigRed} 
                    bezier 
                    style={styles.chart} 
                />
            </View>
        </View>
    </View>
);

const FinancialReport: React.FC = () => (
    <View style={styles.tabContent}>
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Resumo Financeiro</Text>
            </View>
            <View style={styles.cardContent}>
                <View style={styles.financialGrid}>
                    <FinancialStatBox label="Receita Total" value={financialSummary.totalRevenue} color="#166534" bgColor="#dcfce7" />
                    <FinancialStatBox label="Manutenção" value={financialSummary.maintenance} color="#1d4ed8" bgColor="#dbeafe" />
                    <FinancialStatBox label="Segurança" value={financialSummary.security} color="#7e22ce" bgColor="#f3e8ff" />
                    <FinancialStatBox label="Limpeza" value={financialSummary.cleaning} color="#b45309" bgColor="#fef3c7" />
                </View>
            </View>
        </View>
    </View>
);

const FinancialStatBox: React.FC<FinancialStatBoxProps> = ({ label, value, color, bgColor }) => (
    <View style={[styles.financialBox, { backgroundColor: bgColor }]}>
        <Text style={[styles.financialValue, { color }]}>R$ {value.toLocaleString('pt-BR')}</Text>
        <Text style={[styles.financialLabel, { color }]}>{label}</Text>
    </View>
);

