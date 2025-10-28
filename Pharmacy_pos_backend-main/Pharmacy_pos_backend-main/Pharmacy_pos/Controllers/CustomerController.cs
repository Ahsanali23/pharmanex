using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pharmacy_pos.Data;
using Pharmacy_pos.Helper;
using Pharmacy_pos.Models;
namespace Pharmacy_pos.Controllers
{
    public class CustomerDto
    {
        
        public string Name { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public string Email { get; set; }
        // Update an existing customer
       
       // public DateTime CreatedAt { get; set; }
    }
    public class CustomerDto1
    {
        public int Id { get; set; } // Include the Id property  
        public string Name { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public string Email { get; set; }
        public DateTime CreatedAt { get; set; } // Add CreatedAt property  
    }
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CustomerController> _logger;
        private readonly IConfiguration _config;

        public CustomerController(ApplicationDbContext context, ILogger<CustomerController> logger, IConfiguration config)
        {
            _context = context;
            _logger = logger;
            _config = config;
        }


        // Add a new customer
        [HttpPost("add")]
        public async Task<IActionResult> AddCustomer([FromBody] CustomerDto customerDto)
        {
            try
            {
                //if (!await HelperFunction.HasPermissionAsync(_context, User, "Customer.Add"))
                //    return Forbid("You do not have permission to Add Customer.");
                if (customerDto == null || string.IsNullOrEmpty(customerDto.Email))
                {
                    return BadRequest("Invalid customer data.");
                }

                var existingCustomer = await _context.Customer.FirstOrDefaultAsync(c => c.Email == customerDto.Email);
                if (existingCustomer != null)
                {
                    return Conflict("A customer with the same email already exists.");
                }

                var customer = new Customer
                {
                    Name = customerDto.Name,
                    Phone = customerDto.Phone,
                    Address = customerDto.Address,
                    Email = customerDto.Email,
                    CreatedAt = DateTime.UtcNow // Set the creation date
                };

                _context.Customer.Add(customer);
                await _context.SaveChangesAsync();
                return Ok(customerDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while adding the role .");
                return StatusCode(500, $"An error occurred while adding the role: {ex.Message}");
            }
        }
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateCustomer(int id, [FromBody] CustomerDto customerDto)
        {
            try
            {
                if (customerDto == null || string.IsNullOrEmpty(customerDto.Email))
                {
                    return BadRequest("Invalid customer data.");
                }

                var customer = await _context.Customer.FindAsync(id);
                if (customer == null)
                {
                    return NotFound("Customer not found.");
                }

                // Check for duplicate email (excluding current customer)
                var existingCustomer = await _context.Customer
                    .FirstOrDefaultAsync(c => c.Email == customerDto.Email && c.Id != id);
                if (existingCustomer != null)
                {
                    return Conflict("A customer with the same email already exists.");
                }

                customer.Name = customerDto.Name;
                customer.Phone = customerDto.Phone;
                customer.Address = customerDto.Address;
                customer.Email = customerDto.Email;

                _context.Customer.Update(customer);
                await _context.SaveChangesAsync();

                return Ok(new CustomerDto1
                {
                    Id = customer.Id,
                    Name = customer.Name,
                    Phone = customer.Phone,
                    Address = customer.Address,
                    Email = customer.Email,
                    CreatedAt = customer.CreatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating the customer.");
                return StatusCode(500, $"An error occurred while updating the customer: {ex.Message}");
            }
        }

        // Fetch all customers
        [HttpGet("all")]
        public async Task<IActionResult> GetAllCustomers()

        {
            try
            {
                //if (!await HelperFunction.HasPermissionAsync(_context, User, "Customer.Get"))
                //    return Forbid("You do not have permission to Add Customer.");
                var customers = await _context.Customer
           .Select(c => new CustomerDto1
           {
               Id=c.Id,
               Name = c.Name,
               Phone = c.Phone,
               Address = c.Address,
               Email = c.Email,
               CreatedAt=c.CreatedAt
           })
           .ToListAsync();

                return Ok(customers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while adding the role.");
                return StatusCode(500, $"An error occurred while adding the role: {ex.Message}");
            }
        }

        // Fetch the top 5 latest customers, unique by email
        [HttpGet("top-latest")]
        public async Task<IActionResult> GetTopLatestCustomers()
        {
            try
            {
                var customers = await _context.Customer
                .GroupBy(c => c.Email)
                .Select(g => g.FirstOrDefault())
                .OrderByDescending(c => c.Id)
                .Take(5)
                .ToListAsync();

                return Ok(customers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while adding the role ");
                return StatusCode(500, $"An error occurred while adding the role: {ex.Message}");
            }
        }
    }
}
