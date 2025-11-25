'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Edit, Trash2, Server, HardDrive, Wifi, Radio, Save } from 'lucide-react'
import { ethers } from 'ethers'

interface Resource {
  id: string
  resourceType: 'compute' | 'storage' | 'bandwidth' | 'sensor'
  capacity: string
  pricePerUnit: string
  isActive: boolean
}

interface ManageResourcesModalProps {
  providerAddress: string
  existingResources: Resource[]
  onClose: () => void
  onSave: (resources: Resource[]) => Promise<void>
}

const resourceConfig = {
  compute: {
    icon: Server,
    label: 'Compute/GPU',
    unit: 'cores',
    color: 'blue',
    placeholder: 'Ex: 64',
    help: 'CPU cores or GPU equivalent capacity'
  },
  storage: {
    icon: HardDrive,
    label: 'Storage',
    unit: 'GB',
    color: 'green',
    placeholder: 'Ex: 500',
    help: 'Available storage in gigabytes'
  },
  bandwidth: {
    icon: Wifi,
    label: 'Bandwidth',
    unit: 'Mbps',
    color: 'purple',
    placeholder: 'Ex: 100',
    help: 'Network bandwidth in megabits per second'
  },
  sensor: {
    icon: Radio,
    label: 'IoT Sensors',
    unit: 'sensors',
    color: 'orange',
    placeholder: 'Ex: 25',
    help: 'Number of IoT sensors available'
  }
}

export default function ManageResourcesModal({
  providerAddress,
  existingResources,
  onClose,
  onSave
}: Readonly<ManageResourcesModalProps>) {
  const [resources, setResources] = useState<Resource[]>(existingResources)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Atualizar recursos quando existingResources mudar
  useEffect(() => {
    setResources(existingResources)
  }, [existingResources])

  const [newResource, setNewResource] = useState({
    resourceType: 'compute' as Resource['resourceType'],
    capacity: '',
    pricePerUnit: ''
  })

  const handleAddResource = () => {
    if (!newResource.capacity || !newResource.pricePerUnit) {
      return
    }

    const resource: Resource = {
      id: `new-${Date.now()}`,
      resourceType: newResource.resourceType,
      capacity: newResource.capacity,
      pricePerUnit: ethers.parseUnits(newResource.pricePerUnit, 18).toString(),
      isActive: true
    }

    setResources([...resources, resource])
    setNewResource({ resourceType: 'compute', capacity: '', pricePerUnit: '' })
    setShowAddForm(false)
  }

  const handleUpdateResource = (id: string, updates: Partial<Resource>) => {
    setResources(resources.map(r => 
      r.id === id ? { ...r, ...updates } : r
    ))
    // Não fechar o modo de edição automaticamente - deixar o usuário decidir
  }

  const handleRemoveResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id))
  }

  const handleToggleActive = (id: string) => {
    setResources(resources.map(r =>
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onSave(resources)
      onClose()
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const availableTypes = Object.keys(resourceConfig).filter(
    type => !resources.some(r => r.resourceType === type)
  ) as Resource['resourceType'][]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Manage Resources
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Add, edit, or remove resource types you provide
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Existing Resources */}
          <div className="space-y-4 mb-6">
            <AnimatePresence>
              {resources.map((resource) => {
                const config = resourceConfig[resource.resourceType]
                const Icon = config.icon
                const isEditing = editingId === resource.id

                return (
                  <motion.div
                    key={resource.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={`border-2 rounded-xl p-4 transition-all ${
                      resource.isActive
                        ? 'border-gray-200 dark:border-gray-700'
                        : 'border-gray-100 dark:border-gray-800 opacity-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-${config.color}-50 dark:bg-${config.color}-900/20`}>
                        <Icon className={`w-6 h-6 text-${config.color}-600 dark:text-${config.color}-400`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {config.label}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {config.help}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleActive(resource.id)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                resource.isActive
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                              }`}
                            >
                              {resource.isActive ? 'Active' : 'Inactive'}
                            </button>
                            <button
                              onClick={() => setEditingId(isEditing ? null : resource.id)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleRemoveResource(resource.id)}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Capacity ({config.unit})
                              </label>
                              <input
                                type="number"
                                value={resource.capacity}
                                onChange={(e) => handleUpdateResource(resource.id, { capacity: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Price per {config.unit} (INGRID)
                              </label>
                              <input
                                type="number"
                                step="0.0001"
                                value={ethers.formatUnits(resource.pricePerUnit, 18)}
                                onChange={(e) => {
                                  try {
                                    const value = e.target.value || '0'
                                    const parsed = ethers.parseUnits(value, 18).toString()
                                    handleUpdateResource(resource.id, { pricePerUnit: parsed })
                                  } catch (error) {
                                    console.error('Error parsing price:', error)
                                    // Se der erro, manter o valor anterior
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Capacity</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {resource.capacity} {config.unit}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Price per {config.unit}</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {Number.parseFloat(ethers.formatUnits(resource.pricePerUnit, 18)).toFixed(4)} INGRID
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {resources.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                <Server className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No resources added yet. Click "Add Resource" to get started.
                </p>
              </div>
            )}
          </div>

          {/* Add New Resource Form */}
          <AnimatePresence>
            {showAddForm && availableTypes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-2 border-orange-300 dark:border-orange-700 rounded-xl p-4 bg-orange-50 dark:bg-orange-900/10"
              >
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Add New Resource</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Resource Type
                    </label>
                    <select
                      value={newResource.resourceType}
                      onChange={(e) => setNewResource({ ...newResource, resourceType: e.target.value as Resource['resourceType'] })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    >
                      {availableTypes.map(type => (
                        <option key={type} value={type}>
                          {resourceConfig[type].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Capacity ({resourceConfig[newResource.resourceType].unit})
                      </label>
                      <input
                        type="number"
                        value={newResource.capacity}
                        onChange={(e) => setNewResource({ ...newResource, capacity: e.target.value })}
                        placeholder={resourceConfig[newResource.resourceType].placeholder}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Price per {resourceConfig[newResource.resourceType].unit} (INGRID)
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={newResource.pricePerUnit}
                        onChange={(e) => setNewResource({ ...newResource, pricePerUnit: e.target.value })}
                        placeholder="0.0001"
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleAddResource}
                      disabled={!newResource.capacity || !newResource.pricePerUnit}
                      className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
                    >
                      Add Resource
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false)
                        setNewResource({ resourceType: 'compute', capacity: '', pricePerUnit: '' })
                      }}
                      className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add Resource Button */}
          {!showAddForm && availableTypes.length > 0 && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors group"
            >
              <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Add Resource Type</span>
              </div>
            </button>
          )}

          {availableTypes.length === 0 && !showAddForm && resources.length > 0 && (
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                All resource types have been added!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || resources.length === 0}
              className="flex-1 bg-orange-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? 'Saving...' : (
                <>
                  <Save className="w-5 h-5" />
                  Save All Changes
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
