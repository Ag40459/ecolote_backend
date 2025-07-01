# 🧪 Como Testar do 7 ao 12 no Frontend (Projeto Ecolote)

As fases 7 até a 12 envolvem o frontend, mas podem ser testadas com abordagens automatizadas semelhantes às utilizadas no backend.

## ✅ Testes automatizados no frontend

Você pode usar ferramentas como:

- **Vitest** + **React Testing Library** → para testar componentes, contextos e interações
- **MSW (Mock Service Worker)** → para simular respostas da API
- **Cypress** ou **Playwright** → para testes ponta a ponta com navegação real

---

## 🖥️ Tabela: O que e como testar nas Fases 7 a 12

| Fase | Pode testar? | Ferramentas recomendadas | O que validar |
|------|--------------|--------------------------|---------------|
| **7 - LeadDetails.jsx** | ✅ | React Testing Library, Vitest, MSW | Botões chamam endpoints corretos, UI atualiza conforme respostas |
| **8 - Contextos e Lista** | ✅ | React Testing Library, mocks de contexto | Dados fluem corretamente, filtros e status refletem as mudanças |
| **9 - LeadsToReactivate.jsx** | ✅ | React Testing Library, MSW | Exibição correta dos leads, botões \"Descartar\" e \"Pedir Novo Prazo\" funcionam |
| **10 - Testes Finais** | ✅ | Cypress ou Playwright | Simular fluxo completo no navegador: início → atendimento → reativação |
| **11 - Documentação** | ⚠️ | Não testável automaticamente | Validar documentação manualmente |
| **12 - Entrega final** | ⚠️ | Testes manuais com usuário | Validar experiência do usuário e feedback ao final |