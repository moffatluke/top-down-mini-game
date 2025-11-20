// Zelda-style Inventory System
class ZeldaInventory {
    constructor(spriteLoader) {
        this.spriteLoader = spriteLoader;
        
        // Available equipment
        this.weapons = [
            { id: 'none', name: 'None', sprite: null },
            { id: 'sword', name: 'Sword', sprite: 'steel_weapons' },
            { id: 'staff', name: 'Magic Staff', sprite: 'magic_staff' }
        ];
        
        this.armor = [
            { id: 'none', name: 'No Armor', sprite: 'llama_base' },
            { id: 'knight', name: 'Knight Armor', sprite: 'llama_knight' }
        ];
        
        // Current equipped items
        this.currentWeaponIndex = 1; // Start with sword equipped
        this.currentArmorIndex = 0;  // Start with no armor
        
        // Collected items (what's available in inventory)
        this.collectedWeapons = new Set(['none', 'sword', 'staff']); // Start with all weapons available
        this.collectedArmor = new Set(['none']);   // Start with no armor - must find it!
    }
    
    // Add item to inventory when collected
    addItem(itemId) {
        // Check if it's a weapon
        const weapon = this.weapons.find(w => w.id === itemId);
        if (weapon) {
            this.collectedWeapons.add(itemId);
            return true;
        }
        
        // Check if it's armor
        const armor = this.armor.find(a => a.id === itemId);
        if (armor) {
            this.collectedArmor.add(itemId);
            return true;
        }
        
        return false;
    }
    
    // Select specific weapon by ID
    selectWeapon(weaponId) {
        // Check if weapon is available in inventory
        if (!this.collectedWeapons.has(weaponId)) {
            console.log(`Weapon '${weaponId}' not available in inventory`);
            return;
        }
        
        const weaponIndex = this.weapons.findIndex(w => w.id === weaponId);
        if (weaponIndex !== -1) {
            this.currentWeaponIndex = weaponIndex;
        }
    }
    
    // Cycle to next available weapon
    cycleWeapon() {
        const availableWeapons = this.weapons.filter(w => this.collectedWeapons.has(w.id));
        if (availableWeapons.length <= 1) return;
        
        let currentAvailableIndex = availableWeapons.findIndex(w => w.id === this.weapons[this.currentWeaponIndex].id);
        currentAvailableIndex = (currentAvailableIndex + 1) % availableWeapons.length;
        
        const newWeapon = availableWeapons[currentAvailableIndex];
        this.currentWeaponIndex = this.weapons.findIndex(w => w.id === newWeapon.id);
    }
    
    // Cycle to next available armor
    cycleArmor() {
        const availableArmor = this.armor.filter(a => this.collectedArmor.has(a.id));
        if (availableArmor.length <= 1) return;
        
        let currentAvailableIndex = availableArmor.findIndex(a => a.id === this.armor[this.currentArmorIndex].id);
        currentAvailableIndex = (currentAvailableIndex + 1) % availableArmor.length;
        
        const newArmor = availableArmor[currentAvailableIndex];
        this.currentArmorIndex = this.armor.findIndex(a => a.id === newArmor.id);
    }
    
    // Get currently equipped items
    getCurrentWeapon() {
        return this.weapons[this.currentWeaponIndex];
    }
    
    getCurrentArmor() {
        return this.armor[this.currentArmorIndex];
    }
}