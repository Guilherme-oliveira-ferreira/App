# Arquitetura da Aplicação – Chama Já

A aplicação segue uma arquitetura simples baseada em um único componente principal (`App.js`) com gerenciamento de estado via **React Hooks** (`useState`, `useEffect`, `useMemo`).

## 1. Principais telas (controladas por estado `screen`)

- `home`: tela inicial com o logo "Chama Já".
- `askName`: coleta nome, idade e perfil (cliente/administrador).
- `adminPass`: valida a senha fixa de administrador.
- `adminManage`: gerenciamento de senhas (CRUD local).
- `clientTicket`: tela onde o cliente informa a senha.
- `alarm`: tela de opções (notificação, WhatsApp, Instagram).

## 2. Estados principais

- `screen`: controla navegação entre telas.
- `name`, `age`: dados básicos do usuário.
- `role`: perfil atual (`'client'` ou `'admin'`).
- `tickets`: lista de senhas cadastradas pelo administrador.
- `clientTicket`: senha informada pelo cliente.
- `waPhone`: telefone opcional para WhatsApp.
- `themeOverride`: alternância manual entre tema claro/escuro.

## 3. Integrações

- **expo-notifications**: envio de notificação local.
- **expo-clipboard**: cópia de senha para área de transferência.
- **Linking API (React Native)**:
  - WhatsApp: `whatsapp://send` e `https://wa.me/`.
  - Instagram: `https://ig.me/USUARIO`.

Não há backend: todos os dados estão apenas em memória enquanto o app está aberto.

