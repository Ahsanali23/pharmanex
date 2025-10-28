namespace Pharmacy_pos.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int CategoryId { get; set; }
        public string Barcode { get; set; }
        public string Brand { get; set; }
        public decimal CostPrice { get; set; }
        public decimal SalePrice { get; set; }
        public int Quantity { get; set; }
        public string Unit { get; set; }
        public DateTime ExpiryDate { get; set; }
        public int AlertQuantity { get; set; }
        public string ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }

        public Category Category { get; set; }
        public ICollection<InventoryLog> InventoryLogs { get; set; }
        public ICollection<SaleItem> SaleItems { get; set; }
        public ICollection<QuotationItem> QuotationItems { get; set; }
        public ICollection<PurchaseItem> PurchaseItems { get; set; }
        public ICollection<Return> Returns { get; set; }
    }
}
