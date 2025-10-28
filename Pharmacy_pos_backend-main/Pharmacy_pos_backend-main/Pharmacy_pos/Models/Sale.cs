namespace Pharmacy_pos.Models
{
    public class Sale
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public int UserId { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal Discount { get; set; }
        public decimal PaidAmount { get; set; }
        public DateTime SaleDate { get; set; }
        public string InvoiceNo { get; set; }
        public string Status { get; set; } = "Paid";
        public Customer Customer { get; set; }
        public User User { get; set; }
        public ICollection<SaleItem> SaleItems { get; set; }
    }

}
