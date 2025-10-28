namespace Pharmacy_pos.Models
{
    public class QuotationItem
    {
        public int Id { get; set; }
        public int QuotationId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal Total { get; set; }

        public Quotation Quotation { get; set; }
        public Product Product { get; set; }
    }
}
