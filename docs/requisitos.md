# Requisitos do Sistema – Chama Já 🔔⚡

## 1. Visão Geral

O **Chama Já** é um aplicativo mobile desenvolvido em React Native (Expo) para auxiliar estabelecimentos que utilizam senhas de atendimento.  
O administrador gera senhas para os clientes e pode chamar cada um por:

- Notificação local no celular;
- Mensagem no WhatsApp;
- Mensagem no Instagram.

O cliente só consegue acessar as opções se informar uma senha que já tenha sido cadastrada pelo administrador.

---

## 2. Requisitos Funcionais (RF)

### RF01 – Cadastro de dados iniciais
O sistema deve permitir que o usuário informe **nome** e **idade** ao abrir o aplicativo.

### RF02 – Seleção de perfil
O sistema deve permitir que o usuário escolha entre dois perfis:
- **Cliente**
- **Administrador**

### RF03 – Autenticação de administrador
O sistema deve solicitar uma **senha fixa de administrador** quando o usuário escolher o perfil **Administrador**.  
Apenas com a senha correta o administrador pode acessar a tela de gerenciamento de senhas.

### RF04 – Geração de senhas (Administrador)
O sistema deve permitir que o administrador:
- Informe o **nome do cliente**;
- Gere uma **senha sequencial de 5 dígitos** (ex.: 00001, 00002, 00003...).

### RF05 – Listagem de senhas (Administrador)
O sistema deve exibir uma lista com todas as senhas geradas, contendo:
- Nome do cliente;
- Código da senha (5 dígitos);
- Data e horário de criação.

### RF06 – Edição de senhas (Administrador)
O sistema deve permitir que o administrador **edite o nome** do cliente associado a uma senha já criada.

### RF07 – Exclusão de senhas (Administrador)
O sistema deve permitir que o administrador **exclua** uma senha da lista.

### RF08 – Reset geral (Administrador)
O sistema deve permitir que o administrador:
- Apague todas as senhas;
- Zere o contador de sequência para voltar a gerar a partir de **00001**.

### RF09 – Validação de senha (Cliente)
O sistema deve permitir que o cliente informe uma senha de 5 dígitos.  
O cliente **só poderá continuar** se a senha existir na lista de senhas cadastradas pelo administrador.

### RF10 – Notificação local (Alarme)
O sistema deve permitir que, na tela de opções, o usuário dispare uma **notificação local** com a mensagem:
- `"Sua senha é X"` (onde X é o código informado/cadastrado).

### RF11 – Envio de mensagem via WhatsApp
O sistema deve permitir que o usuário:
- Informe opcionalmente um número de WhatsApp no formato **55DDDNÚMERO**;  
- Abra o WhatsApp com uma mensagem pré-preenchida contendo:
  - O nome do cliente (se informado);
  - A senha do cliente.

Caso nenhum número seja informado, o aplicativo deve abrir o WhatsApp para o usuário escolher o contato manualmente.

### RF12 – Envio de mensagem via Instagram
O sistema deve permitir que o usuário abra o **Instagram Direct** para um usuário pré-configurado (conta do estabelecimento), com uma mensagem pré-preenchida do tipo:
- `"Sua senha é X"`.

### RF13 – Cópia de senha para área de transferência
O sistema deve permitir que, na tela de gerenciamento de senhas, o administrador toque em uma senha para **copiar o código** para a área de transferência do dispositivo.

### RF14 – Atalho de opções por senha (Administrador)
O sistema deve permitir que, na lista de senhas, o administrador selecione **“Opções”** em uma senha específica para:
- Preencher automaticamente o **nome** e a **senha** daquele cliente;
- Ir diretamente para a tela de opções (Alarme / WhatsApp / Instagram).

---

## 3. Requisitos Não Funcionais (RNF)

### RNF01 – Tecnologia
A aplicação deve ser desenvolvida utilizando:
- **React Native** com **Expo**;
- Bibliotecas como `expo-notifications`, `expo-clipboard` e `Linking` da própria API do React Native.

### RNF02 – Plataforma
A aplicação deve funcionar em dispositivos **Android**.

### RNF03 – Interface
A interface deve:
- Ser responsiva em diferentes tamanhos de tela;
- Oferecer suporte a **tema claro** e **tema escuro**;
- Utilizar textos e ícones claros para os botões principais (Alarme, WhatsApp, Instagram, etc.).

### RNF04 – Armazenamento
Os dados de senhas serão mantidos **apenas em memória** (não há backend ou banco de dados persistente nesta versão).

### RNF05 – Usabilidade
O fluxo de uso deve ser simples, permitindo que:
- Clientes utilizem a aplicação sem treinamento;
- Administradores entendam rapidamente como gerar e chamar senhas.

### RNF06 – Idioma
Toda a interface deve estar em **português**.

---

## 4. Restrições

- O aplicativo não possui backend nem sincronização entre múltiplos dispositivos.
- As senhas e dados cadastrados são perdidos ao fechar completamente o aplicativo.
- O envio de mensagens e abertura de WhatsApp/Instagram depende de o usuário ter esses aplicativos instalados e configurados no dispositivo.

