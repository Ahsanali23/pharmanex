using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using Pharmacy_pos.Models;

namespace Pharmacy_pos.Data
{
    public class ApplicationDbContext : DbContext
    {


        public DbSet<PurchaseItem> PurchaseItems { get; set; }
        public DbSet<QuotationItem> QuotationItems { get; set; }
        public DbSet<Return> Returns { get; set; }
        public DbSet<Product> Product { get; set; }
        public DbSet<Purchase> Purchase { get; set; }
        public DbSet<PurchaseItem> PurchaseItem { get; set; }

        public DbSet<Quotation> Quotations { get; set; }
        public DbSet<User> User { get; set; }
        public DbSet<Category> Category { get; set; }
        public DbSet<Customer> Customer { get; set; }
        public DbSet<Supplier> Supplier { get; set; }
        public DbSet<Sale> Sale { get; set; }
        public DbSet<SaleItem> SaleItem { get; set; }

        public DbSet<InventoryLog> InventoryLogs { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Permission> Permission { get; set; }
        public DbSet<RolePermission> RolePermission { get; set; }
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Seed Permissions
            var permissions = new[]
            {
                new Permission { Id = 1, Name = "User.Add", Module = "User" },
                new Permission { Id = 2, Name = "User.Edit", Module = "User" },
                new Permission { Id = 3, Name = "User.Delete", Module = "User" },
                new Permission { Id = 31, Name = "User.Get", Module = "User" },
                new Permission { Id = 4, Name = "Role.Add", Module = "Role" },
                new Permission { Id = 5, Name = "Role.Edit", Module = "Role" },
                new Permission { Id = 6, Name = "Role.Delete", Module = "Role" },
                new Permission { Id = 32, Name = "Role.Get", Module = "Role" },
                new Permission { Id = 7, Name = "Customer.Add", Module = "Customer" },
                new Permission { Id = 8, Name = "Customer.Edit", Module = "Customer" },
                new Permission { Id = 9, Name = "Customer.Delete", Module = "Customer" },
                new Permission { Id = 33, Name = "Customer.Get", Module = "Customer" },
                new Permission { Id = 10, Name = "Product.Add", Module = "Product" },
                new Permission { Id = 11, Name = "Product.Edit", Module = "Product" },
                new Permission { Id = 12, Name = "Product.Delete", Module = "Product" },
                new Permission { Id = 34, Name = "Product.Get", Module = "Product" },
                new Permission { Id = 13, Name = "Category.Add", Module = "Category" },
                new Permission { Id = 14, Name = "Category.Edit", Module = "Category" },
                new Permission { Id = 15, Name = "Category.Delete", Module = "Category" },
                new Permission { Id = 35, Name = "Category.Get", Module = "Category" },
                new Permission { Id = 16, Name = "Supplier.Add", Module = "Supplier" },
                new Permission { Id = 17, Name = "Supplier.Edit", Module = "Supplier" },
                new Permission { Id = 18, Name = "Supplier.Delete", Module = "Supplier" },
                new Permission { Id = 36, Name = "Supplier.Get", Module = "Supplier" },
                new Permission { Id = 19, Name = "Purchase.Add", Module = "Purchase" },
                new Permission { Id = 20, Name = "Purchase.Edit", Module = "Purchase" },
                new Permission { Id = 21, Name = "Purchase.Delete", Module = "Purchase" },
                new Permission { Id = 37, Name = "Purchase.Get", Module = "Purchase" },
                new Permission { Id = 22, Name = "Sale.Add", Module = "Sale" },
                new Permission { Id = 23, Name = "Sale.Edit", Module = "Sale" },
                new Permission { Id = 24, Name = "Sale.Delete", Module = "Sale" },
                new Permission { Id = 38, Name = "Sale.Get", Module = "Sale" },
                new Permission { Id = 25, Name = "Quotation.Add", Module = "Quotation" },
                new Permission { Id = 26, Name = "Quotation.Edit", Module = "Quotation" },
                new Permission { Id = 27, Name = "Quotation.Delete", Module = "Quotation" },
                new Permission { Id = 39, Name = "Quotation.Get", Module = "Quotation" },
                new Permission { Id = 28, Name = "Return.Add", Module = "Return" },
                new Permission { Id = 29, Name = "Return.Edit", Module = "Return" },
                new Permission { Id = 30, Name = "Return.Delete", Module = "Return" },
                new Permission { Id = 40, Name = "Return.Get", Module = "Return" },
                new Permission { Id = 41, Name = "Report.View", Module = "Report" } // Added permission for report view
                // Add more permissions as needed for other controllers/actions
            };
            modelBuilder.Entity<Permission>().HasData(permissions);

            // Seed SuperAdmin Role
            var superAdminRole = new Role { Id = 1, Name = "SuperAdmin", Description = "Super administrator with all permissions" };
            modelBuilder.Entity<Role>().HasData(superAdminRole);

            // Assign all permissions to SuperAdmin Role
            var rolePermissions = permissions.Select((p, i) => new RolePermission { Id = -(i + 1), RoleId = 1, PermissionId = p.Id }).ToArray();
            modelBuilder.Entity<RolePermission>().HasData(rolePermissions);

            // Seed SuperAdmin User (password will be set in a migration or seeder)
            var superAdminUser = new User
            {
                Id = 2,
                Name = "SuperAdmin",
                Email = "superadmin@pharmacy.com",
                Password = "$2a$11$sM9wvXwUTvk.of/NhyQ1BO.BCHuUONz5.2wxAQo2l7sC4z4BC6Onm",//SuperAdminPassword123!
                RoleId = 1,
                Status = "Active",
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            };
            modelBuilder.Entity<User>().HasData(superAdminUser);
        }

    }

}
