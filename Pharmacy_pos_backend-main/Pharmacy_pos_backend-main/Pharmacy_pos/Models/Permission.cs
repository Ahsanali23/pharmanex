namespace Pharmacy_pos.Models
{
    public class Permission
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Module { get; set; }

        public ICollection<RolePermission> RolePermissions { get; set; }
    }
}
