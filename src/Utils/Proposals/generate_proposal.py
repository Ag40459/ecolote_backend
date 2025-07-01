from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.colors import HexColor
import os
import json
import sys
from datetime import datetime

# --- Configurações e Estilos --- #

# Cores da marca (baseadas na análise do PDF)
COLOR_PRIMARY = HexColor("#06B6D4")  # Azul claro
COLOR_SECONDARY = HexColor("#8B5CF6") # Roxo
COLOR_ACCENT = HexColor("#DCFCE7")   # Verde claro (para fundos)
COLOR_TEXT_DARK = HexColor("#1E293B") # Texto escuro
COLOR_TEXT_LIGHT = HexColor("#64748B") # Texto secundário

# Caminho para a logo (assumindo que estará no mesmo diretório ou em um assets)
LOGO_PATH = os.path.join(os.path.dirname(__file__), "ecolote_logo.png")

# Estilos de parágrafo
styles = getSampleStyleSheet()

styles.add(ParagraphStyle(name='TitleProposal', 
                          parent=styles['h1'], 
                          fontName='Helvetica-Bold', 
                          fontSize=24, 
                          leading=28, 
                          alignment=TA_CENTER,
                          textColor=COLOR_TEXT_DARK))

styles.add(ParagraphStyle(name='SubtitleProposal', 
                          parent=styles['h2'], 
                          fontName='Helvetica-Bold', 
                          fontSize=16, 
                          leading=20, 
                          alignment=TA_LEFT,
                          textColor=COLOR_TEXT_DARK,
                          spaceAfter=10))

styles.add(ParagraphStyle(name='NormalText', 
                          parent=styles['Normal'], 
                          fontName='Helvetica', 
                          fontSize=10, 
                          leading=14, 
                          textColor=COLOR_TEXT_DARK))

styles.add(ParagraphStyle(name='SmallText', 
                          parent=styles['Normal'], 
                          fontName='Helvetica', 
                          fontSize=8, 
                          leading=10, 
                          textColor=COLOR_TEXT_LIGHT))

styles.add(ParagraphStyle(name='HighlightValue', 
                          parent=styles['Normal'], 
                          fontName='Helvetica-Bold', 
                          fontSize=20, 
                          leading=24, 
                          alignment=TA_CENTER,
                          textColor=COLOR_SECONDARY))

styles.add(ParagraphStyle(name='HighlightLabel', 
                          parent=styles['Normal'], 
                          fontName='Helvetica-Bold', 
                          fontSize=12, 
                          leading=14, 
                          alignment=TA_CENTER,
                          textColor=COLOR_TEXT_LIGHT))

styles.add(ParagraphStyle(name='SectionHeader', 
                          parent=styles['h2'], 
                          fontName='Helvetica-Bold', 
                          fontSize=14, 
                          leading=18, 
                          alignment=TA_LEFT,
                          textColor=COLOR_PRIMARY,
                          spaceAfter=5,
                          borderPadding=5,
                          borderColor=COLOR_PRIMARY,
                          borderWidth=0.5,
                          borderPadding=0,
                          underline=True))

styles.add(ParagraphStyle(name='ListItem', 
                          parent=styles['Normal'], 
                          fontName='Helvetica', 
                          fontSize=10, 
                          leading=14, 
                          textColor=COLOR_TEXT_DARK,
                          leftIndent=15))

# --- Funções de Geração de Elementos --- #

def create_header(doc_data):
    # Header com logo, título e dados da proposta
    logo = Image(LOGO_PATH, width=1.5*cm, height=1.5*cm)
    logo.hAlign = 'LEFT'

    header_table_data = [
        [logo, Paragraph("SOLUÇÕES ENERGÉTICAS DE CONFIANÇA", styles["h2"], alignment=TA_RIGHT)],
        ["", Paragraph(f"Proposta: {doc_data.get('proposal_number', 'N/A')}<br/>Data: {doc_data.get('proposal_date', 'N/A')}<br/>Válida até: {doc_data.get('valid_until', 'N/A')}", styles["SmallText"])]
    ]

    header_table_style = TableStyle([
        ('ALIGN', (0,0), (0,0), 'LEFT'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('SPAN', (0,0), (0,1)),
        ('BACKGROUND', (0,0), (-1,-1), COLOR_ACCENT)
    ])

    header_table = Table(header_table_data, colWidths=[A4[0]*0.2, A4[0]*0.8]) # Ajustado colWidths
    header_table.setStyle(header_table_style)
    return header_table

def create_footer():
    # Footer com informações de contato
    footer_text = [
        Paragraph("Ecolote", styles["SmallText"]),
        Paragraph("www.ecolote.com.br", styles["SmallText"], alignment=TA_CENTER),
        Paragraph("(81) 98596-7343", styles["SmallText"], alignment=TA_RIGHT)
    ]
    footer_table = Table([footer_text], colWidths=[A4[0]/3, A4[0]/3, A4[0]/3])
    footer_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,0), 'LEFT'),
        ('ALIGN', (1,0), (1,0), 'CENTER'),
        ('ALIGN', (2,0), (2,0), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    return footer_table

def generate_proposal_pdf(output_path, data):
    doc = SimpleDocTemplate(output_path, pagesize=A4, 
                            rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    
    story = []

    # --- Capa (Sugestão de Melhoria) ---
    # if data.get(\'include_cover\', False):
    #     story.append(Paragraph("PROPOSTA COMERCIAL", styles["TitleProposal"]))
    #     story.append(Spacer(0, 0.5*cm))
    #     story.append(Paragraph(data.get(\'client_name\', \'Condomínio/Sobrado\'), styles["SubtitleProposal"], alignment=TA_CENTER))
    #     story.append(Spacer(0, 2*cm))
    #     # Adicionar imagem do prédio aqui
    #     story.append(Spacer(0, 10*cm))
    #     story.append(Paragraph("SOLUÇÕES ENERGÉTICAS DE CONFIANÇA", styles["h2"], alignment=TA_CENTER))
    #     story.append(Paragraph("com uma parceria para vida!", styles["NormalText"], alignment=TA_CENTER))
    #     story.append(PageBreak())

    # --- Página 1: Resumo Financeiro --- #
    story.append(Paragraph("PROPOSTA COMERCIAL", styles["TitleProposal"]))
    story.append(Paragraph(data.get('client_name', 'Condomínio Sobrado'), styles["SubtitleProposal"], alignment=TA_CENTER))
    story.append(Spacer(0, 0.5*cm))

    # Resumo Financeiro da Proposta
    story.append(Paragraph("RESUMO FINANCEIRO DA PROPOSTA", styles["SectionHeader"]))
    story.append(Spacer(0, 0.5*cm))

    # Tabela de valores
    resumo_data = [
        [
            Paragraph("Valor indicado da conta de luz", styles["HighlightLabel"]),
            Paragraph("Sua economia média em 10 anos", styles["HighlightLabel"])
        ],
        [
            Paragraph(f"R$ {data.get('current_light_bill_value', 0.00):.2f}", styles["HighlightValue"]),
            Paragraph(f"R$ {data.get('average_economy_10_years', 0.00):.2f}", styles["HighlightValue"])
        ]
    ]
    resumo_table = Table(resumo_data, colWidths=[A4[0]/2 - 2*cm, A4[0]/2 - 2*cm])
    resumo_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (-1,-1), COLOR_ACCENT),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor("#E0E0E0")), # Linhas da grade
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('ROUNDEDCORNERS', (0,0), (-1,-1), 10) # Cantos arredondados
    ]))
    story.append(resumo_table)
    story.append(Spacer(0, 1*cm))

    # Valor do Ecolote com desconto
    story.append(Paragraph("Valor do Ecolote com desconto", styles["HighlightLabel"]))
    story.append(Paragraph(f"R$ {data.get('ecolote_discount_value', 0.00):.2f}", ParagraphStyle('TitleProposalColored', parent=styles["TitleProposal"], textColor=COLOR_SECONDARY)))
    story.append(Paragraph("À vista; Boleto Bancário; Financiamento em até 84 vezes", styles["NormalText"], alignment=TA_CENTER))
    story.append(Spacer(0, 1*cm))

    # Financiamento
    story.append(Paragraph("FINANCIAMENTO", styles["SectionHeader"]))
    story.append(Spacer(0, 0.5*cm))
    story.append(Paragraph("Com o pagamento da 1ª parcela em até 4 meses.", styles["NormalText"]))
    story.append(Spacer(0, 0.5*cm))

    # Tabela de opções de financiamento
    financiamento_data = [
        ["36x de", "48x de", "60x de", "72x de", "84x de"],
        [
            f"R$ {data.get('parcela_36x', 0.00):.2f}",
            f"R$ {data.get('parcela_48x', 0.00):.2f}",
            f"R$ {data.get('parcela_60x', 0.00):.2f}",
            f"R$ {data.get('parcela_72x', 0.00):.2f}",
            f"R$ {data.get('parcela_84x', 0.00):.2f}"
        ]
    ]
    financiamento_table = Table(financiamento_data, colWidths=[A4[0]/5 - 2*cm/5]*5)
    financiamento_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (-1,-1), COLOR_ACCENT),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor("#E0E0E0")), # Linhas da grade
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('ROUNDEDCORNERS', (0,0), (-1,-1), 5)
    ]))
    story.append(financiamento_table)
    story.append(Spacer(0, 0.5*cm))
    story.append(Paragraph("Sujeito a aprovação de crédito. Parcelas podem sofrer alterações de acordo com a analise feita pelo banco escolhido.", styles["SmallText"], alignment=TA_CENTER))
    story.append(Spacer(0, 1*cm))

    # --- Página 2: Para Seu Bolso e Apenas o Ecolote Oferece --- #
    story.append(PageBreak()) # Adicionado para garantir nova página
    story.append(Paragraph("PARA SEU BOLSO", styles["SectionHeader"]))
    story.append(Spacer(0, 0.5*cm))
    
    # Benefícios para o bolso
    beneficios_bolso = [
        "Manutenção nos equipamentos Incluído na mensalidade",
        "Redução de até 90% na conta de energia",
        "Valorização de todos os apartamentos do condomínio",
        "Troca de equipamentos fora da garantia a preço de fábrica",
        "Acumule kWh não utilizados por até 5 anos"
    ]
    for item in beneficios_bolso:
        story.append(Paragraph(f"• {item}", styles["ListItem"]))
        story.append(Spacer(0, 0.2*cm))
    story.append(Spacer(0, 1*cm))

    story.append(Paragraph("APENAS O ECOLOTE OFERECE!", styles["SectionHeader"]))
    story.append(Spacer(0, 0.5*cm))

    # O que o Ecolote oferece
    ecolote_oferece = [
        ["Equipamento de última geração", "Projeto de homologação em parceria com sua concessionária"],
        ["Monitoramento constante, 24/7, da sua usina e equipamento", "Seguro para sua usina já incluso na mensalidade paga a associação"]
    ]
    # Ajuste para garantir que cada par de itens fique em uma linha separada
    for row_items in ecolote_oferece:
        table_row_content = []
        for item in row_items:
            table_row_content.append(Paragraph(item, styles["NormalText"], alignment=TA_CENTER))
        story.append(Table([table_row_content], colWidths=[A4[0]/2 - 2*cm]*2))
        story.append(Spacer(0, 0.5*cm))
    story.append(Spacer(0, 1*cm))

    # --- Página 3: Passo a Passo da Entrega --- #
    story.append(PageBreak()) # Adicionado para garantir nova página
    story.append(Paragraph("ENTENDA O PASSO A PASSO DA ENTREGA DA SUA SOLUÇÃO", styles["SectionHeader"]))
    story.append(Spacer(0, 0.5*cm))

    passo_a_passo = [
        ("1", "Análise da proposta. Você está aqui.", "Pré-cadastro pode ser feito até 20/08/2025"),
        ("2", "Realizar o Pré-Cadastro", "Escolha a sua pretenção de compra.\nFinanciamento leva até 5 dias para aprovação"),
        ("3", "Início das Vendas", "Início das vendas dia 21/08/2025\nDesconto Garantido aos pré-cadastrados"),
        ("4", "Assinatura do Contrato", "Envio da documentação e análise para o financiamento.\nApós aprovação o condomínio irá ingressar na associação Ecolote"),
        ("5", "Instalação / Homologação", "Até 45 dias para entrega da usina\nAcesso as câmeras de monitoramento liberado"),
        ("6", "Início da Produção", "A partir desse ponto sua usina já estará injetando energia na rede e acumulando kWh\nAcesso ao aplicativo de controle de kWh gerados da usina liberado")
    ]

    for num, title, desc in passo_a_passo:
        story.append(Paragraph(f"<b>{num}</b> - {title}", styles["SubtitleProposal"]))
        story.append(Paragraph(desc, styles["NormalText"]))
        story.append(Spacer(0, 0.5*cm))
    story.append(Spacer(0, 1*cm))

    # --- Página 4: Como Funciona a Geração de Energia Remota --- #
    story.append(PageBreak()) # Adicionado para garantir nova página
    story.append(Paragraph("COMO FUNCIONA A GERAÇÃO DE ENERGIA REMOTA", styles["SectionHeader"]))
    story.append(Spacer(0, 0.5*cm))

    como_funciona = [
        ("1", "Ao aderir ao Ecolote, sua energia é gerada pela sua usina solar e injetada diretamente na rede da concessionária. Os créditos de energia gerados (kWh) são abatidos na sua conta de luz, levando a conta até a taxação mínima"),
        ("2", "A energia gerada será acompanhada por aplicativo, o que dará maior controle sobre a energia injetada na rede"),
        ("3", "A associação ficará responsável pela segurança e manutenção do local tendo uma taxa de R$ 85,37/mês"),
        ("4", "Dentro do mês, se a energia consumida for menor do que a energia gerada, você acumula créditos para os meses seguintes.")
    ]

    for num, desc in como_funciona:
        story.append(Paragraph(f"<b>{num}</b> - {desc}", styles["NormalText"]))
        story.append(Spacer(0, 0.5*cm))
    story.append(Spacer(0, 1*cm))

    # --- Página 5: Informações Importantes --- #
    story.append(PageBreak()) # Adicionado para garantir nova página
    story.append(Paragraph("TRABALHAMOS COM UM DOS MELHORES PAINÉIS SOLARES DO MUNDO", styles["SectionHeader"]))
    story.append(Spacer(0, 0.5*cm))
    story.append(Paragraph("São produtos eficientes, com a durabilidade média de 25 anos e que obtiveram classificação AAA no ranking de bancabilidade.", styles["NormalText"]))
    story.append(Spacer(0, 1*cm))

    story.append(Paragraph("INFORMAÇÕES IMPORTANTES", styles["SectionHeader"]))
    story.append(Spacer(0, 0.5*cm))

    info_importantes = [
        "**Ecolote: Detalhes Essenciais para Sua Decisão Inteligente!**",
        "Para que você e seu condomínio tomem a melhor decisão, reunimos informações cruciais que destacam os diferenciais e a segurança de ter o Ecolote como sua fonte de energia.",
        "**LOCALIZAÇÃO E EFICIÊNCIA: O SOL A SEU FAVOR**",
        "Nosso bairro solar está estrategicamente localizado no sertão de Pernambuco. Essa região privilegiada garante um dos maiores índices de irradiação solar do Brasil, o que se traduz em:",
        "*Maior Aproveitamento:* Seus equipamentos operam com máxima eficiência.",
        "*Maior Potência:* Geração de energia otimizada, garantindo mais créditos para sua conta de luz.",
        "*Confiabilidade:* Um ambiente ideal para a produção contínua de energia limpa.",
        "**SEU ECOLOTE: UM ATIVO VALIOSO PARA O CONDOMÍNIO**",
        "A aquisição do Ecolote não é uma despesa, é um investimento em um ativo tangível e seguro. Garantimos que a propriedade do seu Ecolote será *registrada em cartório em nome do condomínio*, proporcionando segurança jurídica e valorização patrimonial.",
        "**SEGURANÇA E GARANTIA: TRANQUILIDADE PARA SEU INVESTIMENTO**",
        "*Seguro Total:* Sua usina conta com seguro contra roubo, furto, incêndio e desastres naturais, garantindo a proteção do seu patrimônio.",
        "*Manutenção Inclusa:* A manutenção preventiva e corretiva está inclusa na taxa associativa, assegurando o bom funcionamento e a longevidade do seu sistema.",
        "*Garantia de Geração:* Comprometemo-nos com a eficiência da sua usina, garantindo a geração de energia prometida.",
        "**FLEXIBILIDADE E ECONOMIA: ADAPTAÇÃO ÀS SUAS NECESSIDADES**",
        "*Créditos de Energia:* Acumule créditos de energia não utilizados por até 5 anos, garantindo que nenhum kWh seja desperdiçado.",
        "*Troca de Equipamentos:* Após o período de garantia, oferecemos a troca de equipamentos a preço de fábrica, mantendo sua usina sempre atualizada e eficiente.",
        "*Flexibilidade de Pagamento:* Diversas opções de financiamento para se adequar ao seu orçamento, com parcelas que cabem no seu bolso.",
        "**TRANSPARÊNCIA E SUPORTE: PARCERIA PARA A VIDA**",
        "*Monitoramento 24/7:* Acompanhe a performance da sua usina em tempo real através de um aplicativo intuitivo.",
        "*Suporte Dedicado:* Nossa equipe está sempre pronta para auxiliar em qualquer dúvida ou necessidade.",
        "*Documentação Clara:* Todos os termos e condições são apresentados de forma transparente, sem letras miúdas.",
        "**Ecolote: A escolha inteligente para um futuro mais sustentável e econômico.**"
    ]

    for item in info_importantes:
        story.append(Paragraph(item, styles["NormalText"]))
        story.append(Spacer(0, 0.2*cm))
    story.append(Spacer(0, 1*cm))

    # --- Geração do PDF --- #
    try:
        doc.build(story, onFirstPage=lambda canvas, doc: canvas.saveState(), onLaterPages=lambda canvas, doc: canvas.saveState())
        print(f"PDF gerado com sucesso em: {output_path}")
    except Exception as e:
        print(f"Erro ao gerar PDF: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python generate_proposal.py <output_path>", file=sys.stderr)
        sys.exit(1)

    output_path = sys.argv[1]
    
    # Dados de exemplo para teste (serão substituídos pelos dados do Node.js)
    example_data = {
        "client_name": "Condomínio Exemplo Teste",
        "proposal_number": "PRO-2025-001",
        "proposal_date": "27/06/2025",
        "valid_until": "27/07/2025",
        "current_light_bill_value": 850.75,
        "average_economy_10_years": 120000.00,
        "ecolote_discount_value": 35000.00,
        "parcela_36x": 1200.50,
        "parcela_48x": 950.25,
        "parcela_60x": 800.00,
        "parcela_72x": 700.00,
        "parcela_84x": 650.00,
        "page_width": A4[0] - 4*cm # Largura da página menos as margens
    }

    # Ler dados do stdin se houver
    if not sys.stdin.isatty(): # Verifica se há dados no stdin
        try:
            input_data = sys.stdin.read()
            if input_data:
                data_from_node = json.loads(input_data)
                example_data.update(data_from_node)
        except json.JSONDecodeError as e:
            print(f"Erro ao decodificar JSON do stdin: {e}", file=sys.stderr)
            sys.exit(1)

    generate_proposal_pdf(output_path, example_data)


