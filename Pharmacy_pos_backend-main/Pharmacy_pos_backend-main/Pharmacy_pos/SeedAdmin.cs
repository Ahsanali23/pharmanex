using System;
using System.Linq;
using Pharmacy_pos.Data;
using Pharmacy_pos.Models;
using BCrypt.Net;

namespace Pharmacy_pos
{
    public static class SeedAdmin
    {
        public static void Run(ApplicationDbContext context)
        {
            if (!context.User.Any(u => u.Email == "admin@pharma.com"))
            {
                var admin = new User
                {
                    Name = "Super Admin",
                    Email = "admin@pharma.com",
                    Password = BCrypt.Net.BCrypt.HashPassword("123456"),
                    RoleId = 1,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow
                };

                context.User.Add(admin);
                context.SaveChanges();
                Console.WriteLine("✅ Admin user created: admin@pharma.com / 123456");
            }
            else
            {
                Console.WriteLine("⚠️ Admin user already exists.");
            }
        }
    }
}
