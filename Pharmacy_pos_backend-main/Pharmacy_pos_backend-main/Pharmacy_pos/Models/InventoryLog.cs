namespace Pharmacy_pos.Models
{
    public class InventoryLog
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ChangeType { get; set; } // e.g., "purchase", "sale", "adjust"
        public int Quantity { get; set; }
        public int? ReferenceId { get; set; }
        public string Note { get; set; }
        public int UserId { get; set; }
        public DateTime CreatedAt { get; set; }

        public Product Product { get; set; }
        public User User { get; set; }
    }
}
