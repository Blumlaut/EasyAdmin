import { useCallback, useEffect, useState } from 'react'
import { callLua } from '../../fivem'
import { Icon } from '../../components/icons'
import { KeyValueTable, type KeyValueRow } from '../../components/KeyValueTable'
import { useModalContext } from '../../ModalContext'
import { createTextInputModal, getStringValue, runModalAction } from '../../modals/helpers'
import { useTranslation } from '../../lib/i18n'
import type { Permissions } from '../../types'

interface ServerInfoProps {
  permissions: Permissions
}

interface ServerInfoData {
  gametype: string | null
  mapname: string | null
  hostname: string | null
  maxClients: string | null
  projectName: string | null
}

export function ServerInfo({ permissions }: ServerInfoProps) {
  const { openModal, closeModal } = useModalContext()
  const { t } = useTranslation()
  const [data, setData] = useState<ServerInfoData | null>(null)
  const [loading, setLoading] = useState(true)

  const canEdit = !!permissions['server.convars']

  const fetchInfo = useCallback(() => {
    setLoading(true)
    callLua<ServerInfoData>('requestServerInfo')
      .then((result) => {
        setData(result)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    fetchInfo()
  }, [fetchInfo])

  const handleEditGametype = () => {
    openModal(createTextInputModal({
      title: t('Set Gametype'),
      label: t('Gametype'),
      placeholder: t('Roleplay'),
      initialValue: data?.gametype ?? '',
      required: true,
      onSubmit: async (values) => {
        const value = getStringValue(values, 'value')
        await runModalAction({
          action: () => callLua('setConvar', { name: 'gametype', value }),
          closeModal,
          successMessage: t('Gametype updated'),
          errorMessage: t('Failed to set gametype'),
        })
        fetchInfo()
      },
    }))
  }

  const handleEditMapName = () => {
    openModal(createTextInputModal({
      title: t('Set Map Name'),
      label: t('Map name'),
      placeholder: t('Chaos Island'),
      initialValue: data?.mapname ?? '',
      required: true,
      onSubmit: async (values) => {
        const value = getStringValue(values, 'value')
        await runModalAction({
          action: () => callLua('setConvar', { name: 'mapname', value }),
          closeModal,
          successMessage: t('Map name updated'),
          errorMessage: t('Failed to set map name'),
        })
        fetchInfo()
      },
    }))
  }

  const rows: KeyValueRow[] = [
    {
      key: t('Hostname'),
      value: data?.hostname ?? '—',
      mono: true,
    },
    {
      key: t('Max Clients'),
      value: data?.maxClients ?? '—',
      mono: true,
    },
    {
      key: t('Project Name'),
      value: data?.projectName ?? '—',
      mono: true,
    },
    {
      key: t('Gametype'),
      value: data?.gametype ?? '—',
      mono: true,
      ...(canEdit ? {
        onClick: handleEditGametype,
        actionLabel: <Icon name="edit" size="xs" />,
      } : {}),
    },
    {
      key: t('Map Name'),
      value: data?.mapname ?? '—',
      mono: true,
      ...(canEdit ? {
        onClick: handleEditMapName,
        actionLabel: <Icon name="edit" size="xs" />,
      } : {}),
    },
  ]

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <p className="section-label mb-0">{t("Server Info")}</p>
        {canEdit && (
          <button
            className="btn btn-ghost btn-xs"
            onClick={fetchInfo}
            disabled={loading}
            title={t("Refresh")}
          >
            <Icon name="refresh" size="xs" />
          </button>
        )}
      </div>
      <KeyValueTable rows={rows} ariaLabel={t("Server info")} />
    </div>
  )
}
