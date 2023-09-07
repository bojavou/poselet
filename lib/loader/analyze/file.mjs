class ModuleFile {
  type // ModuleType
  // Map<specifier:string,Map<local:string,imported:string|ImportSource>>
  imports = new Map()
  exports = new Map() // Map<exported:string,whence:object>
  wildcards = new Set() // Set<specifier:string>
}

export default ModuleFile
