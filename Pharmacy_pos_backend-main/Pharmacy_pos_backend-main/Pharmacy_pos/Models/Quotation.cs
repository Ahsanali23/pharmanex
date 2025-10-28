namespace Pharmacy_pos.Models
{
    public class Quotation
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public int UserId { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal Discount { get; set; }
        public DateTime QuotationDate { get; set; }
        public string Status { get; set; }

        public Customer Customer { get; set; }
        public User User { get; set; }
        public ICollection<QuotationItem> QuotationItems { get; set; }
    }
}
