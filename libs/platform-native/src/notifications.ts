export const P07_NOTIFICATION_TITLE = 'P07 approval'
export const P07_CHANNEL_ID = 'viviefs-p07-alarm'

export type DeferredNotificationData = {
  kind: 'deferred' | 'clock'
  workflowName: string
  executionId: string
  deferredName: string
  clockName?: string
}

const identifierFor = (executionId: string, name: string) =>
  `viviefs-${executionId}-${name}`.slice(0, 64)

const loadNotifications = () => import('expo-notifications')

export const ensureNotificationChannel = async (): Promise<void> => {
  const Notifications = await loadNotifications()
  try {
    await Notifications.setNotificationChannelAsync(P07_CHANNEL_ID, {
      name: 'ViViEfs alarms',
      importance: Notifications.AndroidImportance.MAX,
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      enableVibrate: true,
    })
  } catch {
    // iOS has no channels; the call is Android-only.
  }
}

export const requestNotificationPermission = async (): Promise<boolean> => {
  const Notifications = await loadNotifications()
  await Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowAlert: true,
    }),
  })
  await ensureNotificationChannel()
  const existing = await Notifications.getPermissionsAsync()
  if (existing.granted) return true
  const next = await Promise.race([
    Notifications.requestPermissionsAsync(),
    new Promise<{ granted: boolean }>((resolve) =>
      setTimeout(() => resolve({ granted: false }), 4000),
    ),
  ])
  return next.granted
}

export const scheduleDeferredNotification = async (options: {
  executionId: string
  workflowName: string
  deferredName: string
  seconds: number
}): Promise<string> => {
  const Notifications = await loadNotifications()
  await ensureNotificationChannel()
  const data: DeferredNotificationData = {
    kind: 'deferred',
    workflowName: options.workflowName,
    executionId: options.executionId,
    deferredName: options.deferredName,
  }
  return Notifications.scheduleNotificationAsync({
    identifier: identifierFor(options.executionId, options.deferredName),
    content: {
      title: P07_NOTIFICATION_TITLE,
      body: 'Tap to complete the deferred',
      data,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(2, options.seconds),
      repeats: false,
      channelId: P07_CHANNEL_ID,
    },
  })
}

export const scheduleWakeNotification = async (options: {
  executionId: string
  clockName: string
  deferredName: string
  workflowName: string
  wakeAtMs: number
}): Promise<string> => {
  const Notifications = await loadNotifications()
  await ensureNotificationChannel()
  const seconds = Math.max(2, Math.ceil((options.wakeAtMs - Date.now()) / 1000))
  const data: DeferredNotificationData = {
    kind: 'clock',
    workflowName: options.workflowName,
    executionId: options.executionId,
    deferredName: options.deferredName,
    clockName: options.clockName,
  }
  return Notifications.scheduleNotificationAsync({
    identifier: identifierFor(options.executionId, options.clockName),
    content: {
      title: P07_NOTIFICATION_TITLE,
      body: 'Clock wake',
      data,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
      channelId: P07_CHANNEL_ID,
    },
  })
}

export const cancelWakeNotification = async (
  executionId: string,
  clockName: string,
): Promise<void> => {
  const Notifications = await loadNotifications()
  await Notifications.cancelScheduledNotificationAsync(
    identifierFor(executionId, clockName),
  )
}

export const readNotificationData = (
  value: unknown,
): DeferredNotificationData | null => {
  if (!value || typeof value !== 'object') return null
  const data = value as Record<string, unknown>
  if (
    (data.kind !== 'deferred' && data.kind !== 'clock') ||
    typeof data.workflowName !== 'string' ||
    typeof data.executionId !== 'string' ||
    typeof data.deferredName !== 'string'
  ) {
    return null
  }
  return {
    kind: data.kind,
    workflowName: data.workflowName,
    executionId: data.executionId,
    deferredName: data.deferredName,
    ...(typeof data.clockName === 'string' ? { clockName: data.clockName } : {}),
  }
}

export const lastNotificationData =
  async (): Promise<DeferredNotificationData | null> => {
    const Notifications = await loadNotifications()
    const response = await Notifications.getLastNotificationResponseAsync()
    return readNotificationData(response?.notification.request.content.data)
  }

export const subscribeNotificationResponses = (
  onData: (data: DeferredNotificationData) => void,
): (() => void) => {
  let sub: { remove: () => void } | undefined
  void loadNotifications().then((Notifications) => {
    sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = readNotificationData(
        response.notification.request.content.data,
      )
      if (data) onData(data)
    })
  })
  return () => sub?.remove()
}
