using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pharmacy_pos.Data;
using Pharmacy_pos.Helper;
using Pharmacy_pos.Models;

namespace Pharmacy_pos.Controllers
{
    public class categorydto
    {
        public string name { get; set; }
        public string description { get; set; }
    }
    public class ProductDto
    {
        public string Name { get; set; }
        public int CategoryId { get; set; }
        public string Barcode { get; set; }
        public string Brand { get; set; }
        public decimal CostPrice { get; set; }
        public decimal SalePrice { get; set; }
        public string Unit { get; set; }
        public DateTime ExpiryDate { get; set; }
        public int AlertQuantity { get; set; }
        public IFormFile? Image { get; set; }
    }
    [ApiController]
    [Route("api/[controller]")]
    public class ProductAndCategoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProductAndCategoryController> _logger;

        public ProductAndCategoryController(ApplicationDbContext context, ILogger<ProductAndCategoryController> logger)
        {
            _context = context;
            _logger = logger;
        }
        // GET: api/ProductAndCategory/categories
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                if (!await HelperFunction.HasPermissionAsync(_context, User, "Category.Get"))
                    return Forbid("You do not have permission to view categories.");
                var categories = await _context.Category.ToListAsync();
                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while checking permissions.");
                return StatusCode(500, "Internal server error");
                
            }


        }

        // GET: api/ProductAndCategory/products
        [HttpGet("products")]
        public async Task<IActionResult> GetProducts()
        {
            try
            {
                if (!await HelperFunction.HasPermissionAsync(_context, User, "Product.Get"))
                    return Forbid("You do not have permission to view products.");
               // var products = await _context.Product.ToListAsync();
                var products = await _context.Product
           .Include(p => p.Category)
           .Select(p => new
           {
               p.Id,
               p.Name,
               p.CategoryId,
               Category = p.Category != null ? p.Category.Name : null,
               p.Barcode,
               p.Brand,
               p.CostPrice,
               p.SalePrice,
               p.Quantity,
               p.Unit,
               p.ExpiryDate,
               p.AlertQuantity,
               p.CreatedAt,
               ImageUrl = string.IsNullOrEmpty(p.ImageUrl)
                   ? $"{Request.Scheme}://{Request.Host}/product_images/default.jpeg"
                   : $"{Request.Scheme}://{Request.Host}/{p.ImageUrl}"
           })
           .ToListAsync();

                return Ok(products);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while checking permissions.");
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/ProductAndCategory/category
        [HttpPost("category")]
        public async Task<IActionResult> AddCategory([FromBody] categorydto category)
        {
            try
            {
                if (!await HelperFunction.HasPermissionAsync(_context, User, "Category.Add"))
                    return Forbid("You do not have permission to add categories.");
                if (category == null || string.IsNullOrWhiteSpace(category.name))
                    return BadRequest("Invalid category data.");

                var newCategory = new Category
                {
                    Name = category.name,
                    Description = category.description
                };

                _context.Category.Add(newCategory);
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetCategories), new { id = newCategory.Id }, newCategory);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while adding the category.");
                return StatusCode(500, "Internal server error");
            }
        }
        // PUT: api/ProductAndCategory/category/{id}
        [HttpPut("category/{id}")]
        public async Task<IActionResult> EditCategory(int id, [FromBody] categorydto category)
        {
            try
            {
                if (!await HelperFunction.HasPermissionAsync(_context, User, "Category.Edit"))
                    return Forbid("You do not have permission to edit categories.");
                //if (category == null || id != category.Id)
                //    return BadRequest("Invalid category data.");

                var existing = await _context.Category.FindAsync(id);
                if (existing == null)
                    return NotFound();

                existing.Name = category.name;
                existing.Description = category.description;
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while editing the category.");
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/ProductAndCategory/product
        [HttpPost("product")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> AddProduct([FromForm] ProductDto dto)
        {
            try
            {
                if (!await HelperFunction.HasPermissionAsync(_context, User, "Product.Add"))
                    return Forbid("You do not have permission to add products.");
                if (dto == null || string.IsNullOrWhiteSpace(dto.Name))
                    return BadRequest("Invalid product data.");

                var product = new Product
                {
                    Name = dto.Name,
                    CategoryId = dto.CategoryId,
                    Barcode = dto.Barcode,
                    Brand = dto.Brand,
                    CostPrice = dto.CostPrice,
                    SalePrice = dto.SalePrice,
                    Unit = dto.Unit,
                    ExpiryDate = dto.ExpiryDate,
                    AlertQuantity = dto.AlertQuantity,
                    Quantity = 0,
                    CreatedAt = DateTime.UtcNow
                };
                if (dto.Image != null && dto.Image.Length > 0)
                {
                    var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "product_images");
                    if (!Directory.Exists(uploadsRoot))
                        Directory.CreateDirectory(uploadsRoot);

                    var fileExt = Path.GetExtension(dto.Image.FileName);
                    var fileName = $"product_{Guid.NewGuid():N}{fileExt}";
                    var filePath = Path.Combine(uploadsRoot, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await dto.Image.CopyToAsync(stream);
                    }

                    product.ImageUrl = Path.Combine("product_images", fileName).Replace("\\", "/");
                }

                _context.Product.Add(product);
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetProducts), new { id = product.Id }, product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while adding the product.");
                return StatusCode(500, "Internal server error");
            }
        }
        // PUT: api/ProductAndCategory/product/{id}
        [HttpPut("product/{id}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> EditProduct(int id, [FromForm] ProductDto dto)
        {
            try
            {
                if (!await HelperFunction.HasPermissionAsync(_context, User, "Product.Edit"))
                    return Forbid("You do not have permission to edit products.");
                if (dto == null )
                    return BadRequest("Invalid product data.");

                var product = await _context.Product.FindAsync(id);
                if (product == null)
                    return NotFound();

                // Maintain existing quantity
                product.Name = dto.Name;
                product.CategoryId = dto.CategoryId;
                product.Barcode = dto.Barcode;
                product.Brand = dto.Brand;
                product.CostPrice = dto.CostPrice;
                product.SalePrice = dto.SalePrice;
                product.Unit = dto.Unit;
                product.ExpiryDate = dto.ExpiryDate;
                product.AlertQuantity = dto.AlertQuantity;
                if (dto.Image != null && dto.Image.Length > 0)
                {
                    var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "product_images");
                    if (!Directory.Exists(uploadsRoot))
                        Directory.CreateDirectory(uploadsRoot);

                    var fileExt = Path.GetExtension(dto.Image.FileName);
                    var fileName = $"product_{product.Id}{fileExt}";
                    var filePath = Path.Combine(uploadsRoot, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await dto.Image.CopyToAsync(stream);
                    }

                    product.ImageUrl = Path.Combine("product_images", fileName).Replace("\\", "/");
                }

                // Do not update Quantity here
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetProducts), new { id = product.Id }, product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while editing the product.");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
