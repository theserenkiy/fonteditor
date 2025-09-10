#include <stdio.h>

typedef unsigned short uint16_t;
typedef unsigned char uint8_t;
typedef unsigned int uint32_t;

struct {
	//symbol lookup table, each pair is: symbol_code, glyph_id
	uint16_t sym2id[6];			
	//glyph params: glyph_start_position, glyph length
	//each pair starts at index = glyph_id*2
	uint16_t id_params[4];	
	//glyphs data
	uint8_t data[24];
} font_f3 = {
	.sym2id = {53392,0,65,0,53393,1},
	.id_params = {0,12,12,12},
	.data = {
		254, 33, 33, 33, 33, 254, 3, 0, 0, 0, 0, 3, 255, 17, 17, 17,
		17, 225, 3, 2, 2, 2, 2, 1
	}
};







int main()
{
    printf("%d\n",sizeof(font_f3.sym2id));
    return 0;
}