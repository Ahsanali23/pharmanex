namespace Pharmacy_pos.Models
{
    public class Customer
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public string Email { get; set; }
        public DateTime CreatedAt { get; set; }

        public ICollection<Sale> Sales { get; set; }
        public ICollection<Quotation> Quotations { get; set; }
    }

}
