namespace Pharmacy_pos.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public int RoleId { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? ProfilePic { get; set; } = null;
        public Role Role { get; set; }
        public ICollection<Sale> Sales { get; set; }
        public ICollection<Quotation> Quotations { get; set; }
        public ICollection<Purchase> Purchases { get; set; }
        public ICollection<InventoryLog> InventoryLogs { get; set; }
        public ICollection<Notification> Notifications { get; set; }
    }
}
