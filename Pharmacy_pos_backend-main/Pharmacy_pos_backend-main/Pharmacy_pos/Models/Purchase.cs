namespace Pharmacy_pos.Models
{
    public class Purchase
    {
        public int Id { get; set; }
        public int SupplierId { get; set; }
        public int UserId { get; set; }
        public decimal TotalAmount { get; set; }
        public string InvoiceNo { get; set; }
        public DateTime PurchaseDate { get; set; }

        public Supplier Supplier { get; set; }
        public User User { get; set; }
        public ICollection<PurchaseItem> PurchaseItems { get; set; }
    }

}
