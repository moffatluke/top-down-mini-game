// Zelda-style Inventory System
class ZeldaInventory {
    constructor(spriteLoader) {
        this.spriteLoader = spriteLoader;
        
        // Available equipment
        this.weapons = [
            { id: 'none', name: 'None', sprite: null },
            { id: 'sword', name: 'Sword', sprite: 'llamaKnight.png' },
            { id: 'staff', name: 'Magic Staff', sprite: 'magicStaffRed.png' }
        ];
        
        this.armor = [
            { id: 'none', name: 'No Armor', sprite: 'llamaNoArmor.png' },
            { id: 'knight', name: 'Knight Armor', sprite: 'llamaKnight.png' }
        ];
        
        // Current equipped items
        this.currentWeaponIndex = 0; // Start with no weapon
        this.currentArmorIndex = 0;  // Start with no armor
        
        // Collected items (what's available in inventory)
        this.collectedWeapons = new Set(['none', 'sword']); // Start with sword available
        this.collectedArmor = new Set(['none', 'knight']);   // Start with knight armor available
        
        // UI properties
        this.isVisible = false;
        this.uiX = 20;
        this.uiY = 20;
        this.slotSize = 48;
        this.spacing = 8;
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
    
    // Toggle inventory visibility
    toggle() {
        this.isVisible = !this.isVisible;
    }
    
    // Render the inventory UI
    render(ctx, canvasWidth, canvasHeight) {
        if (!this.isVisible) return;
        
        // Draw semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.uiX - 10, this.uiY - 10, 300, 150);
        
        // Draw border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.uiX - 10, this.uiY - 10, 300, 150);
        
        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.fillText('Inventory', this.uiX, this.uiY + 15);
        
        // Weapons section
        ctx.fillStyle = '#ffff99';
        ctx.font = '12px Arial';
        ctx.fillText('Weapons (1,2,3 keys):', this.uiX, this.uiY + 40);
        
        this.renderWeaponSlots(ctx);
        
        // Armor section
        ctx.fillStyle = '#99ccff';
        ctx.fillText('Armor (E to cycle):', this.uiX, this.uiY + 90);
        
        this.renderArmorSlots(ctx);
    }
    
    renderWeaponSlots(ctx) {
        // Show all weapons with their number keys
        this.weapons.forEach((weapon, index) => {
            const x = this.uiX + index * (this.slotSize + this.spacing);
            const y = this.uiY + 45;
            
            // Check if weapon is available
            const isAvailable = this.collectedWeapons.has(weapon.id);
            const isEquipped = weapon.id === this.getCurrentWeapon().id;
            
            // Slot background
            if (isEquipped) {
                ctx.fillStyle = '#ffff99';
            } else if (isAvailable) {
                ctx.fillStyle = '#444444';
            } else {
                ctx.fillStyle = '#222222';
            }
            ctx.fillRect(x, y, this.slotSize, this.slotSize);
            
            // Slot border
            ctx.strokeStyle = isEquipped ? '#ffffff' : (isAvailable ? '#666666' : '#333333');
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, this.slotSize, this.slotSize);
            
            // Number key indicator
            ctx.fillStyle = isEquipped ? '#000000' : '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.fillText((index + 1).toString(), x + 4, y + 16);
            
            // Item name
            ctx.fillStyle = isAvailable ? '#ffffff' : '#666666';
            ctx.font = '10px Arial';
            ctx.fillText(weapon.name, x + 2, y + this.slotSize + 12);
        });
    }
    
    renderArmorSlots(ctx) {
        const availableArmor = this.armor.filter(a => this.collectedArmor.has(a.id));
        const startX = this.uiX;
        const startY = this.uiY + 95;
        
        availableArmor.forEach((armor, index) => {
            const x = startX + index * (this.slotSize + this.spacing);
            const y = startY;
            
            // Slot background
            ctx.fillStyle = armor.id === this.getCurrentArmor().id ? '#99ccff' : '#444444';
            ctx.fillRect(x, y, this.slotSize, this.slotSize);
            
            // Slot border
            ctx.strokeStyle = armor.id === this.getCurrentArmor().id ? '#ffffff' : '#666666';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, this.slotSize, this.slotSize);
            
            // Item name
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Arial';
            ctx.fillText(armor.name, x + 2, y + this.slotSize + 12);
        });
    }
}