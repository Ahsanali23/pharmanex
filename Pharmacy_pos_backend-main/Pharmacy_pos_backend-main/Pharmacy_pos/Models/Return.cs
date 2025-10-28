namespace Pharmacy_pos.Models
{
    public class Return
    {
        public int Id { get; set; }
        public string Type { get; set; } // sale, purchase
        public int ReferenceId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public string Reason { get; set; }
        public DateTime ReturnDate { get; set; }

        public Product Product { get; set; }
    }
}
