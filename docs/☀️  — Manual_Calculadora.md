# ☀️ `solarCalculator` — Simulador de Projeto Solar Fotovoltaico

Esta função simula um projeto fotovoltaico residencial com base no valor da conta de luz e parâmetros locais.  
Ela estima consumo, geração, quantidade de módulos, custo total, financiamento, economia em 10 anos e tempo de retorno do investimento.

---

## 📥 Entradas (Parâmetros)

| Parâmetro         | Tipo     | Padrão            | Descrição                                                                 |
|-------------------|----------|-------------------|---------------------------------------------------------------------------|
| `monthlyBill`     | `number` | —                 | Valor da conta de energia do usuário (em R$)                              |
| `location`        | `string` | "Iguaracy - PE"   | Localização do usuário (opcional)                                         |
| `energyRate`      | `number` | `1.03`            | Tarifa de energia elétrica por kWh (R$/kWh)                               |
| `solarIrradiance` | `number` | `5.3`             | Irradiação solar média local (kWh/m²/dia)                                 |

---

## 📤 Saída (Retorno da Função)

| Variável                 | Tipo     | Descrição                                                                 |
|--------------------------|----------|---------------------------------------------------------------------------|
| `monthlyBill`            | `number` | Valor da conta de luz informada                                          |
| `energyRate`             | `number` | Tarifa de energia utilizada no cálculo                                   |
| `solarIrradiance`        | `number` | Irradiação solar considerada para o local                                |
| `consumptionKwh`         | `number` | Consumo estimado mensal (em kWh), com mínimo de 260 kWh                  |
| `requiredKwp`            | `number` | Potência necessária estimada para atender o consumo                      |
| `modules`                | `number` | Quantidade estimada de módulos fotovoltaicos                             |
| `moduleName`             | `string` | Nome do módulo fotovoltaico utilizado                                    |
| `modulePower`            | `string` | Potência de cada módulo solar                                            |
| `finalPowerKwp`          | `number` | Potência final do sistema considerando os módulos definidos              |
| `realGenerationKwh`      | `number` | Geração estimada mensal do sistema                                       |
| `energySurplus`          | `number` | Excedente energético (geração - consumo)                                 |
| `inverterModel`          | `string` | Modelo de inversor recomendado com base na potência                      |
| `inverterQuantity`       | `number` | Quantidade de inversores recomendada                                     |
| `inverterBrand`          | `string` | Marca do inversor (padrão: GROWATT)                                      |
| `estimatedProjectCost`   | `number` | Custo total estimado do projeto (inclui excedente de área, instalação)   |
| `monthlyInstallment`     | `number` | Valor da parcela mensal estimada no financiamento                        |
| `installmentCount`       | `number` | Número de parcelas do financiamento (60, 72 ou 84)                       |
| `discount`               | `number` | Valor promocional aplicado (padrão: R$ 2000)                             |
| `totalAreaRequired`      | `number` | Área total necessária para instalação dos módulos (em m²)                |
| `excessArea`             | `number` | Área excedente ao limite de 35 m² (em m²)                                |
| `valorMetroQuadrado`     | `number` | Custo aplicado por m² excedente (R$ 174/m²)                              |
| `areaUsedInLots`         | `number` | Proporção da área utilizada em relação a um lote de 35 m² (ex: 1.5)      |
| `savingsIn10Years`       | `number` | Economia total estimada em 10 anos de uso do sistema                     |
| `paybackTime`            | `number` | Tempo de retorno do investimento em anos (com uma casa decimal)          |
| `installment36x`         | `number` | Valor estimado da parcela em 36 meses (juros compostos 1,56% a.m.)       |
| `installment48x`         | `number` | Valor estimado da parcela em 48 meses (juros compostos 1,56% a.m.)       |
| `associationFee`         | `number` | Mensalidade proporcional da associação com base na área utilizada       |



---

## ⚙️ Lógica de Área Excedente

- Cada módulo solar ocupa **2 m²** (`moduleArea = 2`)
- A área mínima inclusa no projeto é de **35 m²**
- Caso a instalação precise de mais de 35 m², é aplicado um **custo adicional de R$ 174,00 por metro excedente**
- A variável `areaUsedInLots` representa quantos "lotes" de 35 m² foram utilizados, por exemplo:
  - `35 m²` → `1.0`
  - `52.5 m²` → `1.5`

---

## 💸 Lógica de Financiamento

- A simulação utiliza juros compostos mensais de **1,56% a.m.**
- O número de parcelas será:
  - `60x` por padrão
  - `72x` se a parcela exceder a conta de luz
  - `84x` se ainda assim exceder

---

## 💰 Lógica de Economia e Retorno

- A economia em 10 anos considera:
  - Geração mensal do sistema em kWh
  - Tarifa atual de energia
  - Reajuste tarifário anual de 8%
  - Degradação do sistema de 0,7% ao ano

- O tempo de retorno (payback) é calculado determinando quando a economia acumulada se iguala ao investimento inicial

---

## 📌 Exemplo de Retorno

```json
{
  "monthlyBill": 500,
  "energyRate": 1.03,
  "solarIrradiance": 5.3,
  "consumptionKwh": 486,
  "requiredKwp": 4.09,
  "modules": 8,
  "moduleName": "WEG 550W",
  "modulePower": "WEG 550W",
  "finalPowerKwp": 4.4,
  "realGenerationKwh": 523,
  "energySurplus": 37,
  "inverterModel": "WEG SIW300H M030 Híbrido",
  "inverterQuantity": 1,
  "inverterBrand": "GROWATT",
  "estimatedProjectCost": 25540.00,
  "monthlyInstallment": 585.75,
  "installmentCount": 72,
  "discount": 2000,
  "totalAreaRequired": 16.0,
  "excessArea": 0,
  "valorMetroQuadrado": 174,
  "areaUsedInLots": 0.46,
  "savingsIn10Years": 85391.24,
  "paybackTime": 2.7
}
```

---

## 🧠 Observações

- A função considera um consumo mínimo de 260 kWh, mesmo que o cálculo baseado na conta de energia seja menor.
- Os custos e condições são personalizáveis.
- A lógica pode ser expandida para incluir modelos e marcas de módulos/inversores conforme a necessidade do projeto.
- A economia em 10 anos e o tempo de retorno são calculados com base em projeções de mercado e podem variar conforme condições reais.

---

## 🗂 Arquivo mantido por
Equipe de Desenvolvimento Fotovoltaico  
🌐 [ecolote.com.br](https://ecolote.com.br)  
📧 [contato@ecolote.com.br](mailto:contato@ecolote.com.br)