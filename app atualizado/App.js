import 'react-native-get-random-values';
import React, { useMemo, useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  Text,
  StyleSheet,
  View,
  Pressable,
  TextInput,
  useColorScheme,
  Alert,
  FlatList,
  Linking,
  Platform,
} from 'react-native';

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Clipboard from 'expo-clipboard';

// ---------- Notificações: handler global ----------
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ---------- Config Instagram ----------
const INSTAGRAM_USERNAME = 'seu_usuario_aqui'; // 👈 TROCAR PELO SEU @ (sem @)

// ---------- Utils ----------
async function copyToClipboard(text) {
  try {
    await Clipboard.setStringAsync(String(text));
    return true;
  } catch (e) {
    return false;
  }
}

const FEMALE_NAMES = [
  'ana','maria','beatriz','bia','clara','laura','luiza','luisa','isabela','isabella','isabel',
  'sofia','sophia','camila','mariana','fernanda','bruna','amanda','bianca','carolina','carol',
  'gabriela','lara','aline','julia','júlia','leticia','letícia','nicole','raissa','raíssa',
  'patricia','patrícia','elisa','helena','valentina','manuela','marina','stefany','stephanie'
];
const MALE_NAMES = [
  'joao','joão','jose','josé','pedro','paulo','luiz','luís','luis','carlos','rafael','gustavo',
  'gabriel','lucas','mateus','matheus','henrique','rodrigo','bruno','thiago','tiago','caio',
  'enrico','enzo','arthur','vinicius','vinícius','davi','daniel','felipe','igor','guilherme',
  'leonardo','miguel','nicolas','samuel','victor','vitor'
];

function guessGender(fullName) {
  if (!fullName) return 'neutral';
  const first = String(fullName)
    .trim()
    .toLowerCase()
    .split(/\s+/)[0]
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (FEMALE_NAMES.includes(first)) return 'female';
  if (MALE_NAMES.includes(first)) return 'male';
  if (first.endsWith('a')) return 'female';
  return 'neutral';
}

const ADMIN_FIXED_PASS = '87654321';
const onlyDigits = (t) => t.replace(/[^0-9]/g, '');
const pad5 = (t) => onlyDigits(t).padStart(5, '0').slice(-5);
const formatSeq = (n) => String(n).padStart(5, '0');

// ---------- App ----------
export default function App() {
  const system = useColorScheme();

  // Permissões de notificação
  useEffect(() => {
    async function initNotifications() {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
        });
      }

      if (!Device.isDevice) {
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Notificações', 'Permissão para enviar notificações não foi concedida.');
      }
    }

    initNotifications();
  }, []);

  const [screen, setScreen] = useState('home'); // 'home' | 'askName' | 'clientTicket' | 'adminPass' | 'adminManage' | 'alarm'
  const [themeOverride, setThemeOverride] = useState(null); // 'light' | 'dark' | null

  // Dados do usuário (fluxo)
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [role, setRole] = useState(null); // 'admin' | 'client'
  const [adminAuthed, setAdminAuthed] = useState(false);

  // AdminPass
  const [adminPass, setAdminPass] = useState('');
  const [adminError, setAdminError] = useState('');

  // ClientTicket (5 dígitos com zero-padding)
  const [clientTicket, setClientTicket] = useState('');

  // AdminManage (CRUD local)
  const [targetUser, setTargetUser] = useState('');
  const [tickets, setTickets] = useState([]); // [{id,user,code,createdAt}]
  const [seq, setSeq] = useState(1); // começa em 1 → 00001
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [toast, setToast] = useState('');
  const [busyReset, setBusyReset] = useState(false);

  // Alarm (WhatsApp com número)
  const [waPhone, setWaPhone] = useState(''); // Ex.: 5511999999999

  const theme = themeOverride || system || 'light';
  const gender = guessGender(name);
  const intAge = parseInt(age, 10);
  const ageValid = Number.isInteger(intAge) && intAge >= 1 && intAge <= 120;

  const C = useMemo(() => {
    const palette =
      theme === 'dark'
        ? {
            bg: '#0b0c10',
            card: '#1f2833',
            text: '#ffffff',
            textMuted: '#c5c6c7',
            accent: '#66fcf1',
            accent2: '#45a29e',
            border: '#2b2d33',
          }
        : {
            bg: '#f6f7fb',
            card: '#ffffff',
            text: '#0b0c10',
            textMuted: '#4b4f56',
            accent: '#0aa5a1',
            accent2: '#087e7b',
            border: '#e4e6eb',
          };

    return {
      palette,
      styles: StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: palette.bg,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 36,
          paddingVertical: 36,
        },
        header: {
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        toggle: {
          backgroundColor: palette.card,
          borderColor: theme === 'dark' ? palette.border : '#d7dadf',
          borderWidth: 1,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 12,
        },
        toggleText: { color: palette.text, fontWeight: '800' },

        // HOME
        alarmRow: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'center',
          marginBottom: 16,
        },
        alarmSpacing: { marginHorizontal: 12 },
        alarmSide: {
          fontSize: 20,
          opacity: theme === 'dark' ? 0.9 : 0.6,
          transform: [{ translateY: 2 }],
        },
        alarmMid: { fontSize: 26 },
        iconCircle: {
          width: 140,
          height: 140,
          borderRadius: 80,
          backgroundColor: palette.card,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: theme === 'dark' ? 0.35 : 0.1,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          borderWidth: 2,
          borderColor: palette.border,
          marginVertical: 18,
        },
        icon: { fontSize: 72, color: palette.accent },
        wordmarkRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 22 },
        wordmarkLeft: {
          color: palette.text,
          fontSize: 48,
          fontWeight: '900',
          letterSpacing: 0.5,
        },
        pill: {
          marginLeft: 14,
          backgroundColor: palette.accent,
          paddingHorizontal: 18,
          paddingVertical: 10,
          borderRadius: 20,
        },
        wordmarkRight: { color: '#0b0c10', fontSize: 40, fontWeight: '900' },

        // ASK NAME
        askCard: {
          width: '90%',
          maxWidth: 520,
          backgroundColor: palette.card,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: theme === 'dark' ? palette.border : '#d7dadf',
          position: 'relative',
        },
        badgeWrap: {
          position: 'absolute',
          top: -14,
          right: 14,
          backgroundColor: theme === 'dark' ? '#0b0c10' : '#e9f7f6',
          borderRadius: 16,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderWidth: 1,
          borderColor: theme === 'dark' ? palette.border : '#d7dadf',
          flexDirection: 'row',
          alignItems: 'center',
        },
        askTitle: {
          color: palette.text,
          fontSize: 22,
          fontWeight: '900',
          marginBottom: 12,
          marginTop: 8,
        },
        label: {
          color: palette.textMuted,
          fontSize: 14,
          marginTop: 8,
          marginBottom: 6,
          fontWeight: '700',
        },
        input: {
          backgroundColor: theme === 'dark' ? '#0b0c10' : '#ffffff',
          borderWidth: 1,
          borderColor: theme === 'dark' ? '#2b2d33' : '#d7dadf',
          color: palette.text,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 16,
        },

        roleRow: { flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 2 },
        roleItem: {
          flex: 1,
          paddingVertical: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme === 'dark' ? palette.border : '#d7dadf',
          alignItems: 'center',
          backgroundColor: theme === 'dark' ? '#14181e' : '#f7f9fb',
        },
        roleItemSelected: {
          borderColor: palette.accent,
          backgroundColor: theme === 'dark' ? '#102427' : '#e9f7f6',
        },
        roleText: { fontWeight: '900', color: palette.text },
        hint: { marginTop: 8, color: '#c62828', fontWeight: '700' },
        continueBtn: {
          marginTop: 14,
          backgroundColor: palette.accent,
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: 'center',
        },
        continueDisabled: { opacity: 0.5 },
        continueText: { color: '#0b0c10', fontWeight: '800', fontSize: 16 },

        // ADMIN PASS
        passCard: {
          width: '90%',
          maxWidth: 420,
          backgroundColor: palette.card,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: theme === 'dark' ? palette.border : '#d7dadf',
        },
        passTitle: { color: palette.text, fontSize: 20, fontWeight: '900', marginBottom: 12 },
        passInput: {
          backgroundColor: theme === 'dark' ? '#0b0c10' : '#ffffff',
          borderWidth: 1,
          borderColor: theme === 'dark' ? '#2b2d33' : '#d7dadf',
          color: palette.text,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 16,
        },
        passError: { color: '#d32f2f', marginTop: 8, fontWeight: '700' },
        passRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
        btn: {
          flex: 1,
          alignItems: 'center',
          paddingVertical: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme === 'dark' ? palette.border : '#d7dadf',
          backgroundColor: theme === 'dark' ? '#14181e' : '#f7f9fb',
        },
        btnPrimary: { backgroundColor: '#0aa5a1', borderColor: '#0aa5a1' },
        btnText: { color: palette.text, fontWeight: '900' },
        btnTextPrimary: { color: '#0b0c10', fontWeight: '900' },

        // ADMIN MANAGE
        manageCard: {
          width: '92%',
          maxWidth: 560,
          backgroundColor: palette.card,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: theme === 'dark' ? palette.border : '#d7dadf',
        },
        manageTitle: { color: palette.text, fontSize: 22, fontWeight: '900', marginBottom: 6 },
        manageSubtitle: { color: palette.textMuted, fontSize: 13, marginBottom: 12 },
        field: {
          backgroundColor: theme === 'dark' ? '#0b0c10' : '#ffffff',
          borderWidth: 1,
          borderColor: theme === 'dark' ? '#2b2d33' : '#d7dadf',
          color: palette.text,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 16,
        },
        row: { flexDirection: 'row', gap: 10, marginTop: 12 },
        mainBtn: {
          flex: 1,
          alignItems: 'center',
          paddingVertical: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme === 'dark' ? palette.border : '#d7dadf',
          backgroundColor: theme === 'dark' ? '#14181e' : '#f7f9fb',
        },
        mainBtnPrimary: { backgroundColor: '#0aa5a1', borderColor: '#0aa5a1' },
        mainBtnText: { color: palette.text, fontWeight: '900' },
        mainBtnTextPrimary: { color: '#0b0c10', fontWeight: '900' },
        disabled: { opacity: 0.5 },

        list: { marginTop: 12 },
        item: {
          padding: 14,
          borderRadius: 12,
          backgroundColor: theme === 'dark' ? '#14181e' : '#f7f9fb',
          borderWidth: 1,
          borderColor: theme === 'dark' ? palette.border : '#d7dadf',
          marginBottom: 10,
        },
        itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        itemUser: { color: palette.text, fontWeight: '900' },
        itemCode: { color: palette.text, fontSize: 18, marginTop: 6, fontWeight: '900' },
        itemTime: { color: palette.textMuted, fontSize: 12, marginTop: 4 },
        smallRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
        smallBtn: {
          flex: 1,
          alignItems: 'center',
          paddingVertical: 10,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#d7dadf',
          backgroundColor: theme === 'dark' ? '#11161c' : '#eef3f6',
        },
        danger: { backgroundColor: '#ffebee', borderColor: '#ffcdd2' },

        toast: {
          position: 'absolute',
          bottom: 24,
          left: 24,
          right: 24,
          alignItems: 'center',
          backgroundColor: theme === 'dark' ? '#1f2833' : '#0aa5a1',
          paddingVertical: 10,
          borderRadius: 12,
        },
        toastText: {
          color: theme === 'dark' ? '#cdeaff' : '#ffffff',
          fontWeight: '900',
        },

        // OPTIONS (Alarm)
        optionsList: { width: '86%', maxWidth: 420, gap: 12 },
        optionCard: {
          width: '100%',
          backgroundColor: theme === 'dark' ? '#0b0c10' : '#ffffff',
          borderRadius: 16,
          padding: 18,
          shadowColor: '#000',
          shadowOpacity: theme === 'dark' ? 0.2 : 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
          position: 'relative',
          borderWidth: 2,
          borderColor: theme === 'dark' ? '#2b2d33' : '#d7dadf',
        },
        optionRibbon: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        },
        optionText: { color: palette.text, fontSize: 18, fontWeight: '900' },
        optionSub: { color: palette.text, fontSize: 14, marginTop: 6, opacity: 0.85 },
        optionMeta: { color: palette.textMuted, fontSize: 13, marginTop: 8, fontWeight: '700' },
        optionCorner: { position: 'absolute', right: 12, top: 10, fontSize: 20, opacity: 0.9 },

        backHint: {
          marginTop: 20,
          backgroundColor: theme === 'dark' ? '#1f2833' : '#e9f7f6',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme === 'dark' ? '#2b2d33' : '#d7dadf',
        },
        backHintText: {
          color: theme === 'dark' ? '#66fcf1' : '#087e7b',
          fontWeight: '800',
        },
      }),
    };
  }, [theme]);

  const { styles: S } = C;
  const barStyle = theme === 'dark' ? 'light-content' : 'dark-content';

  // ---------- TELAS ----------
  if (screen === 'alarm') {
    const buildMessage = () => {
      const parts = [];
      if (name.trim()) parts.push(`Olá ${name.trim()}`);
      if (clientTicket.trim()) parts.push(`senha ${clientTicket.trim()}`);
      return parts.join(', ') || 'Olá';
    };
    const sanitizePhone = (v) => v.replace(/\D/g, '');

    // 🔔 Notificação local quando clicar em "Alarme"
    async function triggerAlarmNotification() {
      try {
        const senha = clientTicket.trim();
        const body = senha ? `Sua senha é ${senha}` : 'Seu horário chegou!';

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Chama Já 🔔',
            body,
          },
          trigger: null, // dispara imediatamente
        });

        Alert.alert('Alarme', 'Notificação enviada para o seu celular.');
      } catch (e) {
        Alert.alert('Notificação', 'Não foi possível criar a notificação.');
      }
    }

    async function openWhatsApp() {
      const text = encodeURIComponent(buildMessage());
      const digits = sanitizePhone(waPhone);
      const waApp = digits
        ? `whatsapp://send?phone=${digits}&text=${text}`
        : `whatsapp://send?text=${text}`;
      const waWeb = digits
        ? `https://wa.me/${digits}?text=${text}`
        : `https://wa.me/?text=${text}`;
      try {
        const supported = await Linking.canOpenURL(waApp);
        if (supported) await Linking.openURL(waApp);
        else await Linking.openURL(waWeb);
      } catch (e) {
        Alert.alert('WhatsApp', 'Não foi possível abrir o WhatsApp.');
      }
    }

    // 📸 Abrir Instagram com mensagem "Sua senha é X"
    async function openInstagram() {
      const username = INSTAGRAM_USERNAME;
      const senha = clientTicket.trim();
      const mensagemBase = senha ? `Sua senha é ${senha}` : 'Sua senha é ...';

      if (!username) {
        Alert.alert(
          'Instagram',
          'Usuário do Instagram não está configurado no app.'
        );
        return;
      }

      const igMeLink = `https://ig.me/${username}?text=${encodeURIComponent(
        mensagemBase
      )}`;
      const igProfile = `https://instagram.com/${username}`;

      try {
        const canOpen = await Linking.canOpenURL(igMeLink);
        if (canOpen) {
          await Linking.openURL(igMeLink);
        } else {
          await Linking.openURL(igProfile);
        }
      } catch (e) {
        Alert.alert('Instagram', 'Não foi possível abrir o Instagram.');
      }
    }

    const alarmTitleIcon = gender === 'female' ? '💖' : gender === 'male' ? '💪' : '🔔';
    const waRibbon = '#25D366';
    const igRibbon = '#C13584';

    return (
      <SafeAreaView style={S.container}>
        <StatusBar barStyle={barStyle} />
        <Header theme={theme} setThemeOverride={setThemeOverride} styles={S} />

        {/* Telefone opcional do WhatsApp */}
        <View
          style={[S.optionCard, { width: '86%', maxWidth: 420, marginBottom: 12 }]}
        >
          <View style={[S.optionRibbon, { backgroundColor: '#E0F2F1' }]} />
          <Text style={S.optionText}>Telefone WhatsApp (opcional)</Text>
          <Text style={S.optionMeta}>Formato: 55DDDNÚMERO (apenas dígitos)</Text>
          <TextInput
            style={[S.field, { marginTop: 8 }]}
            value={waPhone}
            onChangeText={(t) => setWaPhone(t.replace(/[^0-9]/g, ''))}
            placeholder="5511999999999"
            placeholderTextColor={'#8a8a8a'}
            keyboardType="phone-pad"
            returnKeyType="done"
            maxLength={15}
          />
        </View>

        <View style={S.optionsList}>
          {/* Alarme */}
          <Pressable style={S.optionCard} onPress={triggerAlarmNotification}>
            <View
              style={[
                S.optionRibbon,
                { backgroundColor: theme === 'dark' ? '#2f3a45' : '#edf1f5' },
              ]}
            />
            <Text style={S.optionText}>{alarmTitleIcon} Alarme</Text>
            {(name.trim() || String(age).trim() || clientTicket.trim()) && (
              <Text style={S.optionSub}>
                {name.trim() ? `para ${name.trim()}` : ''}
                {name.trim() && String(age).trim() ? ', ' : ''}
                {String(age).trim() ? `${Number(age)} anos` : ''}
                {(name.trim() || String(age).trim()) && clientTicket.trim()
                  ? ' • '
                  : ''}
                {clientTicket.trim() ? `senha ${clientTicket.trim()}` : ''}
              </Text>
            )}
            <Text style={S.optionCorner}>🔔</Text>
          </Pressable>

          {/* WhatsApp */}
          <Pressable style={S.optionCard} onPress={openWhatsApp}>
            <View style={[S.optionRibbon, { backgroundColor: waRibbon }]} />
            <Text style={S.optionText}>💬 Mensagem no WhatsApp</Text>
            {(name.trim() || clientTicket.trim()) && (
              <Text style={S.optionSub}>
                {name.trim() ? `para ${name.trim()}` : ''}
                {name.trim() && clientTicket.trim() ? ' • ' : ''}
                {clientTicket.trim() ? `senha ${clientTicket.trim()}` : ''}
              </Text>
            )}
            <Text style={S.optionMeta}>
              {waPhone.trim()
                ? `vai usar o número ${waPhone}`
                : 'sem número: abre para escolher contato'}
            </Text>
            <Text style={S.optionCorner}>🟢</Text>
          </Pressable>

          {/* Instagram */}
          <Pressable style={S.optionCard} onPress={openInstagram}>
            <View style={[S.optionRibbon, { backgroundColor: igRibbon }]} />
            <Text style={S.optionText}>📸 Direct no Instagram</Text>
            {(name.trim() || clientTicket.trim()) && (
              <Text style={S.optionSub}>
                {name.trim() ? `para ${name.trim()}` : ''}
                {name.trim() && clientTicket.trim() ? ' • ' : ''}
                {clientTicket.trim() ? `senha ${clientTicket.trim()}` : ''}
              </Text>
            )}
            <Text style={S.optionMeta}>toque para abrir o Instagram</Text>
            <Text style={S.optionCorner}>✉️</Text>
          </Pressable>
        </View>

        <Pressable style={S.backHint} onPress={() => setScreen('home')}>
          <Text style={S.backHintText}>Voltar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (screen === 'clientTicket') {
    const normalizedTicket = pad5(clientTicket);
    const isExactly5 = /^\d{5}$/.test(clientTicket);
    const ticketExists = tickets.some((t) => t.code === normalizedTicket);
    const canContinue = isExactly5 && ticketExists;

    const proceed = () => {
      if (!canContinue) return;
      setClientTicket(normalizedTicket);
      setScreen('alarm');
    };

    return (
      <SafeAreaView style={S.container}>
        <StatusBar barStyle={barStyle} />
        <Header theme={theme} setThemeOverride={setThemeOverride} styles={S} />

        <View style={S.manageCard}>
          <Text style={S.manageTitle}>Número da Senha</Text>
          <Text style={S.manageSubtitle}>
            Digite exatamente 5 dígitos (ex.: 00015). A senha precisa ter sido cadastrada pelo administrador.
          </Text>

          <Text
            style={{
              color: '#4b4f56',
              marginTop: 8,
              marginBottom: 6,
              fontWeight: '700',
            }}
          >
            Senha (5 dígitos)
          </Text>
          <TextInput
            style={S.field}
            value={clientTicket}
            onChangeText={(t) => setClientTicket(onlyDigits(t).slice(0, 5))}
            onBlur={() => setClientTicket((old) => pad5(old))}
            placeholder="00001"
            placeholderTextColor={'#8a8a8a'}
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={5}
          />

          {isExactly5 && !ticketExists && (
            <Text
              style={[
                S.manageSubtitle,
                { color: '#d32f2f', marginTop: 4, fontWeight: '700' },
              ]}
            >
              Essa senha ainda não foi cadastrada pelo administrador.
            </Text>
          )}

          <View style={S.row}>
            <Pressable style={S.mainBtn} onPress={() => setScreen('askName')}>
              <Text style={S.mainBtnText}>Voltar</Text>
            </Pressable>
            <Pressable
              style={[S.mainBtn, S.mainBtnPrimary, !canContinue && S.disabled]}
              disabled={!canContinue}
              onPress={proceed}
            >
              <Text style={S.mainBtnTextPrimary}>Continuar</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'adminManage') {
    const generateTicket = () => {
      const user = targetUser.trim();
      if (!user) return;
      const code = formatSeq(seq);
      setSeq((n) => n + 1);
      const item = {
        id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        user,
        code,
        createdAt: new Date(),
      };
      setTickets((prev) => [item, ...prev]);
      setTargetUser('');
    };

    const startEdit = (item) => {
      setEditingId(item.id);
      setEditingName(item.user);
    };
    const saveEdit = () => {
      if (!editingId) return;
      setTickets((prev) =>
        prev.map((it) =>
          it.id === editingId ? { ...it, user: editingName.trim() } : it
        )
      );
      setEditingId(null);
      setEditingName('');
    };

    const removeItem = (id) => {
      setTickets((prev) => prev.filter((it) => it.id !== id));
    };

    const resetAll = () => {
      if (busyReset) return;
      Alert.alert(
        'Zerar tudo',
        'Tem certeza que deseja apagar todas as senhas e zerar o contador?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Zerar',
            style: 'destructive',
            onPress: () => {
              setBusyReset(true);
              setTickets([]);
              setSeq(1);
              setTimeout(() => setBusyReset(false), 300);
            },
          },
        ]
      );
    };

    const copyMsg = async (code) => {
      const ok = await copyToClipboard(code);
      setToast(
        ok ? 'Copiado!' : 'Pronto (não foi possível copiar automaticamente)'
      );
      setTimeout(() => setToast(''), 1200);
    };

    // 🔗 Admin manda mensagem pro cliente com essa senha
    const goToOptionsForItem = (item) => {
      setName(item.user);
      setClientTicket(item.code);
      setScreen('alarm');
    };

    return (
      <SafeAreaView style={S.container}>
        <StatusBar barStyle={barStyle} />
        <Header theme={theme} setThemeOverride={setThemeOverride} styles={S} />

        <View style={S.manageCard}>
          <Text style={S.manageTitle}>Gerenciar Senhas</Text>
          <Text style={S.manageSubtitle}>
            Crie, edite, exclua e liste (local, sem backend).
          </Text>

          <Text style={S.label}>Nome do usuário</Text>
          <TextInput
            style={S.field}
            value={targetUser}
            onChangeText={setTargetUser}
            placeholder="Ex.: Maria, João..."
            placeholderTextColor={'#8a8a8a'}
            autoCapitalize="words"
            returnKeyType="done"
          />

          <View style={S.row}>
            <Pressable
              style={[
                S.mainBtn,
                S.mainBtnPrimary,
                !targetUser.trim() && S.disabled,
              ]}
              onPress={generateTicket}
              disabled={!targetUser.trim()}
            >
              <Text style={S.mainBtnTextPrimary}>Gerar sequência (00001…)</Text>
            </Pressable>
            <Pressable style={[S.mainBtn]} onPress={resetAll}>
              <Text style={S.mainBtnText}>Zerar tudo</Text>
            </Pressable>
          </View>

          <FlatList
            style={S.list}
            data={tickets}
            keyExtractor={(it) => it.id}
            ListEmptyComponent={
              <Text style={S.manageSubtitle}>
                Nenhuma senha criada ainda.
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable onPress={() => copyMsg(item.code)} style={S.item}>
                <View style={S.itemTop}>
                  <Text style={S.itemUser}>👤 {item.user || '—'}</Text>
                  <Text style={S.itemUser}>🔑</Text>
                </View>
                <Text style={S.itemCode}>{item.code}</Text>
                <Text style={S.itemTime}>
                  {item.createdAt.toLocaleDateString()} •{' '}
                  {item.createdAt.toLocaleTimeString()}
                </Text>

                {editingId === item.id ? (
                  <View style={S.smallRow}>
                    <TextInput
                      style={[S.field, { flex: 1 }]}
                      value={editingName}
                      onChangeText={setEditingName}
                      placeholder="Novo nome"
                      placeholderTextColor="#8a8a8a"
                      autoCapitalize="words"
                    />
                    <Pressable
                      style={[S.smallBtn]}
                      onPress={() => {
                        setEditingId(null);
                        setEditingName('');
                      }}
                    >
                      <Text style={S.mainBtnText}>Cancelar</Text>
                    </Pressable>
                    <Pressable
                      style={[
                        S.smallBtn,
                        S.mainBtnPrimary,
                        !editingName.trim() && S.disabled,
                      ]}
                      disabled={!editingName.trim()}
                      onPress={saveEdit}
                    >
                      <Text style={S.mainBtnTextPrimary}>Salvar</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={S.smallRow}>
                    <Pressable
                      style={S.smallBtn}
                      onPress={() => goToOptionsForItem(item)}
                    >
                      <Text style={S.mainBtnText}>Opções</Text>
                    </Pressable>
                    <Pressable
                      style={S.smallBtn}
                      onPress={() => startEdit(item)}
                    >
                      <Text style={S.mainBtnText}>Editar</Text>
                    </Pressable>
                    <Pressable
                      style={[S.smallBtn, S.danger]}
                      onPress={() => removeItem(item.id)}
                    >
                      <Text
                        style={[S.mainBtnText, { color: '#b71c1c' }]}
                      >
                        Excluir
                      </Text>
                    </Pressable>
                  </View>
                )}
              </Pressable>
            )}
          />

          <View style={S.row}>
            <Pressable style={S.mainBtn} onPress={() => setScreen('askName')}>
              <Text style={S.mainBtnText}>Voltar</Text>
            </Pressable>
            <Pressable
              style={[S.mainBtn, S.mainBtnPrimary]}
              onPress={() => setScreen('alarm')}
            >
              <Text style={S.mainBtnTextPrimary}>Ir para opções</Text>
            </Pressable>
          </View>
        </View>

        {!!toast && (
          <View style={S.toast}>
            <Text style={S.toastText}>{toast}</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  if (screen === 'adminPass') {
    const isValid = adminPass.trim().length > 0;
    const confirm = () => {
      if (adminPass === ADMIN_FIXED_PASS) {
        setAdminError('');
        setAdminAuthed(true);
        setScreen('adminManage');
      } else {
        setAdminAuthed(false);
        setAdminError('Senha incorreta.');
      }
    };
    const cancel = () => {
      setAdminPass('');
      setAdminError('');
      setAdminAuthed(false);
      setRole(null);
      setScreen('askName');
    };

    return (
      <SafeAreaView style={S.container}>
        <StatusBar barStyle={barStyle} />
        <Header theme={theme} setThemeOverride={setThemeOverride} styles={S} />
        <View style={S.passCard}>
          <Text style={S.passTitle}>Senha do administrador</Text>
          <TextInput
            style={S.passInput}
            value={adminPass}
            onChangeText={setAdminPass}
            placeholder="Digite a senha"
            placeholderTextColor={'#8a8a8a'}
            secureTextEntry
            returnKeyType="done"
          />
          {!!adminError && <Text style={S.passError}>{adminError}</Text>}
          <View style={S.passRow}>
            <Pressable style={S.btn} onPress={cancel}>
              <Text style={S.btnText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[S.btn, S.btnPrimary, !isValid && S.disabled]}
              onPress={confirm}
              disabled={!isValid}
            >
              <Text style={S.btnTextPrimary}>Confirmar</Text>
            </Pressable>
          </View>
        </View>
        <Pressable style={S.backHint} onPress={() => setScreen('askName')}>
          <Text style={S.backHintText}>Voltar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (screen === 'askName') {
    const canContinue =
      name.trim().length > 0 &&
      ageValid &&
      (role === 'client' || (role === 'admin' && adminAuthed));
    const onContinue = () => {
      if (role === 'client') setScreen('clientTicket');
      else setScreen('alarm');
    };

    return (
      <SafeAreaView style={S.container}>
        <StatusBar barStyle={barStyle} />
        <Header theme={theme} setThemeOverride={setThemeOverride} styles={S} />
        <View style={S.askCard}>
          <View style={S.badgeWrap}>
            <Text style={{ fontSize: 14, marginRight: 6 }}>⚡</Text>
            <Text
              style={{
                color: theme === 'dark' ? '#66fcf1' : '#0aa5a1',
                fontWeight: '900',
              }}
            >
              Chama Já
            </Text>
          </View>

          <Text style={S.askTitle}>Me diga seu nome</Text>
          <TextInput
            style={S.input}
            value={name}
            onChangeText={setName}
            placeholder="Seu nome"
            placeholderTextColor={'#8a8a8a'}
            autoCapitalize="words"
          />

          <Text style={S.label}>Sua idade</Text>
          <TextInput
            style={S.input}
            value={age}
            onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ''))}
            placeholder="Ex.: 21"
            placeholderTextColor={'#8a8a8a'}
            keyboardType="number-pad"
            maxLength={3}
          />

          <Text style={S.label}>Selecione seu perfil</Text>
          <View style={S.roleRow}>
            <Pressable
              onPress={() => {
                setRole('client');
                setAdminAuthed(false);
              }}
              style={[S.roleItem, role === 'client' && S.roleItemSelected]}
            >
              <Text style={S.roleText}>Cliente</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setRole('admin');
                setTimeout(() => setScreen('adminPass'), 0);
              }}
              style={[S.roleItem, role === 'admin' && S.roleItemSelected]}
            >
              <Text style={S.roleText}>Administrador</Text>
            </Pressable>
          </View>

          {role === 'admin' && !adminAuthed && (
            <Text style={S.hint}>
              ⚠️ Toque em “Administrador” para autenticar a senha.
            </Text>
          )}

          <Pressable
            style={[S.continueBtn, !canContinue && S.continueDisabled]}
            disabled={!canContinue}
            onPress={onContinue}
          >
            <Text style={S.continueText}>Continuar</Text>
          </Pressable>
        </View>
        <Pressable style={S.backHint} onPress={() => setScreen('home')}>
          <Text style={S.backHintText}>Voltar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // HOME
  return (
    <SafeAreaView style={S.container}>
      <StatusBar barStyle={barStyle} />
      <Header theme={theme} setThemeOverride={setThemeOverride} styles={S} />
      <View style={S.alarmRow}>
        <Text style={[S.alarmSide, S.alarmSpacing]}>🔔</Text>
        <Text style={[S.alarmMid, S.alarmSpacing]}>🔔</Text>
        <Text style={[S.alarmSide, S.alarmSpacing]}>🔔</Text>
      </View>
      <Pressable style={S.iconCircle} onPress={() => setScreen('askName')}>
        <Text style={S.icon}>⚡</Text>
      </Pressable>
      <View style={[S.alarmRow, { marginTop: 18 }]}>
        <Text style={[S.alarmSide, S.alarmSpacing]}>🔔</Text>
        <Text style={[S.alarmMid, S.alarmSpacing]}>🔔</Text>
        <Text style={[S.alarmSide, S.alarmSpacing]}>🔔</Text>
      </View>
      <View style={S.wordmarkRow}>
        <Text style={S.wordmarkLeft}>Chama</Text>
        <View style={S.pill}>
          <Text style={S.wordmarkRight}>Já</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Header({ theme, setThemeOverride, styles }) {
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <View style={styles.header}>
      <View />
      <Pressable
        onPress={() => setThemeOverride(next)}
        style={styles.toggle}
        hitSlop={8}
      >
        <Text style={styles.toggleText}>
          {theme === 'dark' ? '☀️ Claro' : '🌙 Escuro'}
        </Text>
      </Pressable>
    </View>
  );
}
