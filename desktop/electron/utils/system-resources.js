/**
 * Sistema de Detecção de Recursos do PC
 * Compatível com Windows, Linux e macOS
 * Usa systeminformation para detecção precisa
 */

const os = require('os');
const si = require('systeminformation');

/**
 * Obter informações de CPU usando systeminformation
 */
async function getCPUInfo() {
  try {
    console.log('🔍 system-resources: Getting CPU information...');
    const cpuData = await si.cpu();
    const cpuCurrentSpeed = await si.cpuCurrentSpeed();
    
    console.log('📊 system-resources: CPU data:', {
      manufacturer: cpuData.manufacturer,
      brand: cpuData.brand,
      cores: cpuData.cores,
      physicalCores: cpuData.physicalCores,
      processors: cpuData.processors,
      speed: cpuCurrentSpeed.avg || cpuData.speed || 0
    });
    
    return {
      cores: cpuData.cores || os.cpus().length,
      physicalCores: cpuData.physicalCores || Math.ceil(os.cpus().length / 2),
      processors: cpuData.processors || 1,
      brand: cpuData.brand || cpuData.manufacturer || 'Unknown',
      speed: cpuCurrentSpeed.avg || cpuData.speed || os.cpus()[0]?.speed || 0, // MHz
      usage: 0 // Será calculado dinamicamente
    };
  } catch (error) {
    console.error('❌ system-resources: Error getting CPU info:', error);
    // Fallback para os.cpus()
    const cpus = os.cpus();
    return {
      cores: cpus.length,
      physicalCores: Math.ceil(cpus.length / 2),
      processors: 1,
      brand: 'Unknown',
      speed: cpus[0]?.speed || 0,
      usage: 0
    };
  }
}

/**
 * Obter informações de memória usando systeminformation
 */
async function getMemoryInfo() {
  try {
    console.log('🔍 system-resources: Getting memory information...');
    const memData = await si.mem();
    
    console.log('📊 system-resources: Memory data:', {
      total: memData.total,
      free: memData.free,
      used: memData.used,
      available: memData.available
    });
    
    return {
      total: memData.total, // bytes
      free: memData.free,
      used: memData.used,
      available: memData.available || memData.free,
      unit: 'bytes'
    };
  } catch (error) {
    console.error('❌ system-resources: Error getting memory info:', error);
    // Fallback para os
    const total = os.totalmem();
    const free = os.freemem();
    return {
      total,
      free,
      used: total - free,
      available: free,
      unit: 'bytes'
    };
  }
}

/**
 * Obter informações de armazenamento usando systeminformation
 */
async function getStorageInfo() {
  try {
    console.log('🔍 system-resources: Getting storage information...');
    
    // No Windows, SEMPRE usar wmic diretamente (systeminformation tem bugs)
    const platform = os.platform();
    if (platform === 'win32') {
      const { execSync } = require('child_process');
      console.log('🔍 system-resources: Using wmic for Windows (REQUIRED - systeminformation has bugs)...');
      
      try {
        // wmic retorna: Caption FreeSpace Size
        // Formato: C:    80337485824    1023078821888
        console.log('🔍 system-resources: Executing wmic command...');
        const wmicOutput = execSync('wmic logicaldisk get size,freespace,caption', { 
          encoding: 'utf8', 
          timeout: 10000, // Aumentado para 10 segundos
          maxBuffer: 1024 * 1024 * 2 // 2MB buffer
        });
        
        console.log('🔍 system-resources: wmic raw output (FULL):', wmicOutput);
        console.log('🔍 system-resources: wmic raw output length:', wmicOutput.length);
        
        // Parse do output do wmic
        // Formato esperado:
        // Caption  FreeSpace     Size
        // C:       80337485824   1023078821888
        const lines = wmicOutput.split('\r\n').filter(line => {
          const trimmed = line.trim();
          return trimmed && 
                 !trimmed.includes('Caption') && 
                 !trimmed.includes('FreeSpace') && 
                 !trimmed.includes('Size') &&
                 trimmed.length > 0 &&
                 trimmed.includes(':');
        });
        
        console.log('🔍 system-resources: wmic filtered lines:', lines);
        
        let total = 0;
        let free = 0;
        
        lines.forEach((line, index) => {
          const trimmed = line.trim();
          // Formato: C:    80337485824    1023078821888
          // Ou: C: 80337485824 1023078821888
          const parts = trimmed.split(/\s+/).filter(p => p && p.length > 0);
          
          console.log(`🔍 system-resources: Parsing line ${index}:`, { 
            original: trimmed, 
            parts,
            partsCount: parts.length
          });
          
          if (parts.length >= 3) {
            // wmic retorna na ordem: Caption FreeSpace Size
            const caption = parts[0]; // C:
            const freeSpaceStr = parts[1]; // FreeSpace (menor valor)
            const sizeStr = parts[2]; // Size (maior valor)
            
            const freeSpace = parseInt(freeSpaceStr) || 0;
            const size = parseInt(sizeStr) || 0;
            
            // Validar: size deve ser maior que freeSpace
            if (size > freeSpace && size > 0 && freeSpace >= 0) {
              const sizeGB = size / (1024 ** 3);
              const freeGB = freeSpace / (1024 ** 3);
              
              console.log(`✅ system-resources: Disk ${caption} parsed:`, {
                sizeBytes: size,
                freeBytes: freeSpace,
                sizeGB: sizeGB.toFixed(2),
                freeGB: freeGB.toFixed(2),
                isValid: sizeGB < 10000 && freeGB < 1000
              });
              
              // Só somar se valores forem realistas
              if (sizeGB < 10000 && freeGB < 1000) {
                total += size;
                free += freeSpace;
              } else {
                console.error(`❌ system-resources: Skipping disk ${caption} - unrealistic values!`);
              }
            } else {
              console.warn(`⚠️ system-resources: Invalid values for disk ${caption}: size=${size}, free=${freeSpace}`);
            }
          } else {
            console.warn(`⚠️ system-resources: Could not parse line: ${trimmed}`);
          }
        });
        
        if (total > 0 && free > 0) {
          const used = total - free;
          const totalGB = total / (1024 ** 3);
          const freeGB = free / (1024 ** 3);
          const usedGB = used / (1024 ** 3);
          
          // VALIDAÇÃO FINAL: Garantir que os valores são realistas
          if (freeGB > 1000 || totalGB > 10000) {
            console.error('❌ system-resources: CRITICAL - wmic returned unrealistic values!');
            console.error('❌ system-resources: This should never happen with wmic!');
            throw new Error(`wmic returned unrealistic values: ${freeGB.toFixed(2)} GB free, ${totalGB.toFixed(2)} GB total`);
          }
          
          console.log('✅ system-resources: Storage from wmic (FINAL - VALIDATED):', {
            totalBytes: total,
            usedBytes: used,
            availableBytes: free,
            totalGB: totalGB.toFixed(2),
            usedGB: usedGB.toFixed(2),
            availableGB: freeGB.toFixed(2),
            totalFormatted: totalGB >= 1024 ? `${(totalGB / 1024).toFixed(2)} TB` : `${totalGB.toFixed(2)} GB`,
            availableFormatted: freeGB >= 1024 ? `${(freeGB / 1024).toFixed(2)} TB` : `${freeGB.toFixed(2)} GB`,
            isValid: freeGB < 1000 && totalGB < 10000
          });
          
          const result = {
            total: total,
            used: used,
            available: free,
            unit: 'bytes'
          };
          
          console.log('✅ system-resources: Returning storage result from wmic:', result);
          return result;
        } else {
          console.error('❌ system-resources: wmic returned zero values!', { total, free });
          throw new Error('wmic returned invalid values (total or free is 0)');
        }
      } catch (wmicError) {
        console.error('❌ system-resources: wmic FAILED:', wmicError.message);
        console.error('❌ system-resources: Stack:', wmicError.stack);
        console.error('❌ system-resources: This is critical - wmic should work on Windows!');
        // NO WINDOWS: Não usar systeminformation como fallback - ele tem bugs conhecidos
        // Retornar erro para que o código superior possa tratar
        throw new Error(`wmic failed: ${wmicError.message}`);
      }
    }
    
    // Fallback para systeminformation (APENAS para sistemas não-Windows)
    // NO WINDOWS, este código NUNCA deve ser executado se wmic falhar
    if (platform === 'win32') {
      console.error('❌ system-resources: CRITICAL - Reached systeminformation fallback on Windows!');
      console.error('❌ system-resources: This should never happen - wmic should have succeeded or thrown error');
      throw new Error('Storage detection failed on Windows - wmic failed and systeminformation is unreliable');
    }
    
    const fsSize = await si.fsSize();
    
    // DEBUG: Ver estrutura completa do primeiro disco
    if (fsSize.length > 0) {
      const firstDisk = fsSize[0];
      console.log('🔍 system-resources: First disk from systeminformation:', {
        mount: firstDisk.mount,
        fs: firstDisk.fs,
        size: firstDisk.size,
        used: firstDisk.used,
        available: firstDisk.available,
        sizeInGB: firstDisk.size ? (firstDisk.size / (1024 ** 3)).toFixed(2) : 'N/A',
        availableInGB: firstDisk.available ? (firstDisk.available / (1024 ** 3)).toFixed(2) : 'N/A'
      });
      
      // Verificar se os valores são realistas
      const sizeGB = firstDisk.size ? (firstDisk.size / (1024 ** 3)) : 0;
      const availableGB = firstDisk.available ? (firstDisk.available / (1024 ** 3)) : 0;
      
      if (sizeGB > 10000 || availableGB > 1000) {
        console.error('❌ system-resources: systeminformation values are unrealistic!');
        console.error('❌ system-resources: This suggests a bug in systeminformation or precision error');
        // Tentar usar wmic novamente ou retornar erro
        throw new Error('systeminformation returned unrealistic values');
      }
    }
    
    // Somar todos os discos
    let total = 0;
    let used = 0;
    let available = 0;
    
    fsSize.forEach(disk => {
      // systeminformation.fsSize() retorna valores em BYTES
      // Mas vamos verificar e garantir que está correto
      
      // systeminformation.fsSize() retorna valores em BYTES
      // Mas vamos validar e corrigir se necessário
      
      let sizeBytes = disk.size || 0;
      let usedBytes = disk.used || 0;
      let availableBytes = disk.available || 0;
      
      // VALIDAÇÃO CRÍTICA: Verificar se os valores são realistas
      // Um disco típico tem entre 100GB e 10TB (100GB = 107374182400 bytes, 10TB = 10995116277760 bytes)
      // Se o valor for maior que 100TB (109951162777600 bytes), há um problema
      const MAX_REALISTIC_DISK_SIZE = 100 * (1024 ** 4); // 100 TB em bytes
      
      if (disk.size && disk.size > MAX_REALISTIC_DISK_SIZE) {
        console.error(`❌ system-resources: ERROR - Disk size is unrealistic: ${disk.size} bytes (${(disk.size / (1024 ** 4)).toFixed(2)} TB)`);
        console.error(`❌ system-resources: This suggests a precision error or wrong unit!`);
        console.error(`❌ system-resources: Raw disk object:`, JSON.stringify(disk, null, 2));
        
        // Tentar usar apenas o disco C: (principal) e validar
        // Ou pular este disco se o valor for absurdo
        if (disk.mount === 'C:' || disk.fs === 'C:') {
          console.error(`❌ system-resources: This is the C: drive - values are definitely wrong!`);
          // Não somar valores incorretos
          return; // Pular este disco
        }
      }
      
      // Verificar se está em MB (valores típicos: 100-1000000 para discos comuns)
      // Se size < 1 bilhão E size > 0, provavelmente está em MB
      if (disk.size && disk.size > 0 && disk.size < 1000000000) {
        console.log(`⚠️ system-resources: Values seem to be in MB, not bytes!`);
        console.log(`⚠️ system-resources: Raw values - size: ${disk.size}, used: ${disk.used}, available: ${disk.available}`);
        console.log(`⚠️ system-resources: Converting from MB to bytes...`);
        
        // Converter de MB para bytes
        sizeBytes = disk.size * 1024 * 1024;
        usedBytes = disk.used * 1024 * 1024;
        availableBytes = disk.available * 1024 * 1024;
      }
      
      // DEBUG: Log valores finais
      const availableGB = availableBytes / (1024 ** 3);
      const sizeGB = sizeBytes / (1024 ** 3);
      
      console.log(`🔍 system-resources: Disk ${disk.mount || disk.fs || 'unknown'} - Final values:`, {
        rawSize: disk.size,
        rawAvailable: disk.available,
        sizeBytes,
        availableBytes,
        sizeGB: sizeGB.toFixed(2),
        availableGB: availableGB.toFixed(2),
        expectedGB: '~75', // Valor esperado baseado no comando wmic
        isValid: availableGB < 1000 && sizeGB < 10000 // Validação básica
      });
      
      // Validação: se o valor parece absurdo, não somar
      if (availableGB > 1000 || sizeGB > 10000) {
        console.error(`❌ system-resources: ERROR - Skipping disk ${disk.mount || disk.fs} - values are unrealistic!`);
        return; // Não somar este disco
      }
      
      // Reutilizar as variáveis já declaradas acima
      const usedGB = usedBytes / (1024 ** 3);
      
      console.log(`📦 system-resources: Disk ${disk.mount || disk.fs || 'unknown'}:`, {
        fs: disk.fs,
        type: disk.type,
        mount: disk.mount,
        // Valores brutos do sistema
        rawSize: disk.size,
        rawUsed: disk.used,
        rawAvailable: disk.available,
        // Valores convertidos para bytes
        sizeBytes,
        usedBytes,
        availableBytes,
        // Valores em GB
        sizeGB: sizeGB.toFixed(2),
        usedGB: usedGB.toFixed(2),
        availableGB: availableGB.toFixed(2),
        // Valores formatados
        sizeFormatted: sizeGB >= 1024 ? `${(sizeGB / 1024).toFixed(2)} TB` : `${sizeGB.toFixed(2)} GB`,
        usedFormatted: usedGB >= 1024 ? `${(usedGB / 1024).toFixed(2)} TB` : `${usedGB.toFixed(2)} GB`,
        availableFormatted: availableGB >= 1024 ? `${(availableGB / 1024).toFixed(2)} TB` : `${availableGB.toFixed(2)} GB`
      });
      
      // Só somar se os valores forem válidos
      if (sizeGB < 10000 && availableGB < 1000) {
        total += sizeBytes;
        used += usedBytes;
        available += availableBytes;
      } else {
        console.error(`❌ system-resources: Skipping invalid disk values for ${disk.mount || disk.fs}`);
      }
    });
    
    const totalGB = total / (1024 ** 3);
    const usedGB = used / (1024 ** 3);
    const availableGB = available / (1024 ** 3);
    
    console.log('📊 system-resources: Storage summary:', {
      disks: fsSize.length,
      totalBytes: total,
      usedBytes: used,
      availableBytes: available,
      totalGB: totalGB.toFixed(2),
      usedGB: usedGB.toFixed(2),
      availableGB: availableGB.toFixed(2),
      totalFormatted: totalGB >= 1024 ? `${(totalGB / 1024).toFixed(2)} TB` : `${totalGB.toFixed(2)} GB`,
      usedFormatted: usedGB >= 1024 ? `${(usedGB / 1024).toFixed(2)} TB` : `${usedGB.toFixed(2)} GB`,
      availableFormatted: availableGB >= 1024 ? `${(availableGB / 1024).toFixed(2)} TB` : `${availableGB.toFixed(2)} GB`
    });
    
    // Se não encontrou nada, usar fallback
    if (total === 0) {
      console.warn('⚠️ system-resources: No disks found, using fallback');
      total = os.totalmem() * 2; // Estimativa
      available = os.freemem();
      used = total - available;
    }
    
    return {
      total: total,
      used: used,
      available: available,
      unit: 'bytes'
    };
  } catch (error) {
    console.error('❌ system-resources: Error getting storage info:', error);
    // Fallback
    const total = os.totalmem() * 2;
    const free = os.freemem();
    return {
      total,
      used: total - free,
      available: free,
      unit: 'bytes'
    };
  }
}

/**
 * Obter informações de rede usando systeminformation
 */
async function getNetworkInfo() {
  try {
    console.log('🔍 system-resources: Getting network information...');
    const networkInterfaces = await si.networkInterfaces();
    const networkStats = await si.networkStats();
    
    let totalSpeed = 0;
    let interfaceCount = 0;
    
    // Contar interfaces ativas e estimar velocidade
    networkInterfaces.forEach(iface => {
      if (iface.ip4 && !iface.internal) {
        interfaceCount++;
        // Estimativa baseada no tipo
        if (iface.type === 'wireless' || iface.iface.toLowerCase().includes('wifi') || iface.iface.toLowerCase().includes('wlan')) {
          totalSpeed += 100; // 100 Mbps para Wi-Fi
        } else if (iface.type === 'wired' || iface.iface.toLowerCase().includes('ethernet') || iface.iface.toLowerCase().includes('eth')) {
          totalSpeed += 1000; // 1 Gbps para Ethernet
        } else {
          totalSpeed += 100; // Padrão
        }
      }
    });
    
    console.log('📊 system-resources: Network data:', {
      interfaces: interfaceCount,
      estimatedSpeed: totalSpeed || 100
    });
    
    return {
      speed: totalSpeed || 100, // Mbps
      unit: 'Mbps',
      interfaces: interfaceCount
    };
  } catch (error) {
    console.error('❌ system-resources: Error getting network info:', error);
    // Fallback
    const interfaces = os.networkInterfaces();
    let count = 0;
    for (const name in interfaces) {
      const nets = interfaces[name];
      for (const net of nets) {
        if (net.family === 'IPv4' && !net.internal) {
          count++;
        }
      }
    }
    return {
      speed: 100,
      unit: 'Mbps',
      interfaces: count
    };
  }
}

/**
 * Obter uso atual de CPU (percentual)
 */
function getCPUUsage() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;
  
  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });
  
  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - ~~(100 * idle / total);
  
  return Math.max(0, Math.min(100, usage));
}

/**
 * Obter todos os recursos do sistema
 */
async function getSystemResources() {
  console.log('🔍 system-resources: getSystemResources() called');
  try {
    console.log('📊 system-resources: Collecting system information...');
    
    // Executar getStorageInfo separadamente para tratar erros específicos
    let storage;
    try {
      storage = await getStorageInfo();
      
      // VALIDAÇÃO CRÍTICA: Verificar se storage tem valores realistas
      const storageGB = storage.available / (1024 ** 3);
      const storageTotalGB = storage.total / (1024 ** 3);
      
      console.log('🔍 system-resources: Storage validation:', {
        availableGB: storageGB.toFixed(2),
        totalGB: storageTotalGB.toFixed(2),
        isValid: storageGB < 1000 && storageTotalGB < 10000
      });
      
      if (storageGB > 1000 || storageTotalGB > 10000) {
        console.error('❌ system-resources: CRITICAL ERROR - Storage values are unrealistic!');
        console.error('❌ system-resources: Available:', storageGB.toFixed(2), 'GB (expected ~75 GB)');
        console.error('❌ system-resources: Total:', storageTotalGB.toFixed(2), 'GB (expected ~953 GB)');
        throw new Error('Storage values are unrealistic - wmic likely failed');
      }
    } catch (storageError) {
      console.error('❌ system-resources: getStorageInfo failed:', storageError.message);
      // Se falhar no Windows, tentar wmic diretamente uma última vez
      if (os.platform() === 'win32') {
        console.log('🔄 system-resources: Attempting direct wmic call as last resort...');
        try {
          const { execSync } = require('child_process');
          const wmicOutput = execSync('wmic logicaldisk get size,freespace,caption', { 
            encoding: 'utf8', 
            timeout: 10000,
            maxBuffer: 1024 * 1024
          });
          
          console.log('🔍 system-resources: Direct wmic output (first 500 chars):', wmicOutput.substring(0, 500));
          
          const lines = wmicOutput.split('\r\n').filter(line => {
            const trimmed = line.trim();
            return trimmed && trimmed.includes(':') && 
                   !trimmed.includes('Caption') && 
                   !trimmed.includes('FreeSpace') && 
                   !trimmed.includes('Size');
          });
          
          console.log('🔍 system-resources: Direct wmic filtered lines:', lines);
          
          let wmicTotal = 0;
          let wmicFree = 0;
          
          lines.forEach((line, index) => {
            const parts = line.trim().split(/\s+/).filter(p => p && p.length > 0);
            console.log(`🔍 system-resources: Direct wmic parsing line ${index}:`, { original: line.trim(), parts });
            if (parts.length >= 3) {
              const freeSpace = parseInt(parts[1]) || 0;
              const size = parseInt(parts[2]) || 0;
              if (size > freeSpace && size > 0 && freeSpace >= 0) {
                const sizeGB = size / (1024 ** 3);
                const freeGB = freeSpace / (1024 ** 3);
                if (sizeGB < 10000 && freeGB < 1000) {
                  wmicTotal += size;
                  wmicFree += freeSpace;
                  console.log(`✅ system-resources: Direct wmic disk ${parts[0]}: ${sizeGB.toFixed(2)} GB total, ${freeGB.toFixed(2)} GB free`);
                } else {
                  console.error(`❌ system-resources: Direct wmic disk ${parts[0]} has unrealistic values: ${sizeGB.toFixed(2)} GB total, ${freeGB.toFixed(2)} GB free`);
                }
              }
            }
          });
          
          if (wmicTotal > 0 && wmicFree > 0) {
            const totalGB = wmicTotal / (1024 ** 3);
            const freeGB = wmicFree / (1024 ** 3);
            console.log('✅ system-resources: Direct wmic call successful!', {
              totalGB: totalGB.toFixed(2),
              freeGB: freeGB.toFixed(2),
              usedGB: ((wmicTotal - wmicFree) / (1024 ** 3)).toFixed(2)
            });
            storage = {
              total: wmicTotal,
              used: wmicTotal - wmicFree,
              available: wmicFree,
              unit: 'bytes'
            };
          } else {
            throw new Error('wmic returned invalid values (total or free is 0)');
          }
        } catch (directWmicError) {
          console.error('❌ system-resources: Direct wmic call also failed:', directWmicError.message);
          throw storageError; // Re-throw original error
        }
      } else {
        throw storageError; // Re-throw for non-Windows
      }
    }
    
    const [cpu, memory, network] = await Promise.all([
      getCPUInfo(),
      getMemoryInfo(),
      getNetworkInfo()
    ]);
    
    // VALIDAÇÃO CRÍTICA: Verificar se storage tem valores realistas
    const storageGB = storage.available / (1024 ** 3);
    const storageTotalGB = storage.total / (1024 ** 3);
    
    if (storageGB > 1000 || storageTotalGB > 10000) {
      console.error('❌ system-resources: CRITICAL ERROR - Storage values are unrealistic!');
      console.error('❌ system-resources: Available:', storageGB.toFixed(2), 'GB (expected ~75 GB)');
      console.error('❌ system-resources: Total:', storageTotalGB.toFixed(2), 'GB (expected ~953 GB)');
      console.error('❌ system-resources: This indicates wmic failed and systeminformation returned bad data!');
      
      // Tentar wmic novamente como último recurso
      if (os.platform() === 'win32') {
        try {
          const { execSync } = require('child_process');
          const wmicOutput = execSync('wmic logicaldisk get size,freespace,caption', { encoding: 'utf8', timeout: 5000 });
          const lines = wmicOutput.split('\r\n').filter(line => {
            const trimmed = line.trim();
            return trimmed && trimmed.includes(':') && !trimmed.includes('Caption');
          });
          
          let wmicTotal = 0;
          let wmicFree = 0;
          
          lines.forEach(line => {
            const parts = line.trim().split(/\s+/).filter(p => p);
            if (parts.length >= 3) {
              const freeSpace = parseInt(parts[1]) || 0;
              const size = parseInt(parts[2]) || 0;
              if (size > freeSpace && size > 0) {
                wmicTotal += size;
                wmicFree += freeSpace;
              }
            }
          });
          
          if (wmicTotal > 0 && wmicFree > 0) {
            console.log('✅ system-resources: wmic retry successful!');
            storage.total = wmicTotal;
            storage.available = wmicFree;
            storage.used = wmicTotal - wmicFree;
          }
        } catch (retryError) {
          console.error('❌ system-resources: wmic retry also failed:', retryError.message);
        }
      }
    }
    
    console.log('✅ system-resources: Information collected:', {
      cpu: { cores: cpu.cores, physicalCores: cpu.physicalCores, brand: cpu.brand, speed: cpu.speed },
      memory: { total: memory.total, available: memory.available, used: memory.used },
      storage: { 
        total: storage.total, 
        available: storage.available, 
        used: storage.used,
        totalGB: (storage.total / (1024 ** 3)).toFixed(2),
        availableGB: (storage.available / (1024 ** 3)).toFixed(2)
      },
      network: { speed: network.speed, interfaces: network.interfaces }
    });
    
    // Atualizar uso de CPU
    cpu.usage = getCPUUsage();
    
    const result = {
      compute: {
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        processors: cpu.processors,
        brand: cpu.brand,
        speed: cpu.speed,
        usage: cpu.usage
      },
      memory: {
        total: memory.total,
        free: memory.free,
        used: memory.used,
        available: memory.available,
        usage: (memory.used / memory.total) * 100
      },
      storage: {
        total: storage.total,
        used: storage.used,
        available: storage.available,
        unit: storage.unit,
        usage: storage.total > 0 ? (storage.used / storage.total) * 100 : 0
      },
      network: {
        speed: network.speed,
        unit: network.unit,
        interfaces: network.interfaces
      },
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      timestamp: Date.now()
    };
    
    console.log('✅ system-resources: Final result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('❌ system-resources: Error getting resources:', error);
    console.error('❌ system-resources: Stack:', error.stack);
    throw error;
  }
}

module.exports = {
  getSystemResources,
  getCPUInfo,
  getMemoryInfo,
  getStorageInfo,
  getNetworkInfo,
  getCPUUsage
};

